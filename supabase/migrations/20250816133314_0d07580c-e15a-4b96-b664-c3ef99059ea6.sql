-- Create subscription limits table to define quotas for each plan
CREATE TABLE public.subscription_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan TEXT NOT NULL,
  action TEXT NOT NULL,
  limit_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan, action)
);

-- Enable RLS
ALTER TABLE public.subscription_limits ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read limits
CREATE POLICY "All users can read subscription limits" 
ON public.subscription_limits 
FOR SELECT 
USING (true);

-- Insert default limits for free plan
INSERT INTO public.subscription_limits (plan, action, limit_value) VALUES
('free', 'add_member', 5),
('free', 'group_created', 3),
('free', 'expense_created', 100),
('free', 'invite_sent', 10),
('free', 'ocr_used', 5);

-- Insert limits for personal plan
INSERT INTO public.subscription_limits (plan, action, limit_value) VALUES
('personal', 'add_member', 20),
('personal', 'group_created', 10),
('personal', 'expense_created', 1000),
('personal', 'invite_sent', 50),
('personal', 'ocr_used', 100);

-- Insert limits for family plan
INSERT INTO public.subscription_limits (plan, action, limit_value) VALUES
('family', 'add_member', 50),
('family', 'group_created', 25),
('family', 'expense_created', 5000),
('family', 'invite_sent', 100),
('family', 'ocr_used', 500);

-- Helper function to get user's current subscription plan
CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id uuid)
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_plan TEXT := 'free';
  v_subscription RECORD;
BEGIN
  SELECT plan, status, expires_at 
  INTO v_subscription
  FROM public.user_subscriptions 
  WHERE user_id = p_user_id;
  
  IF FOUND AND v_subscription.status IN ('trialing', 'active') AND v_subscription.expires_at > now() THEN
    v_plan := v_subscription.plan;
  END IF;
  
  RETURN v_plan;
END;
$function$;

-- Helper function to get current count for an action
CREATE OR REPLACE FUNCTION public.get_current_count(p_user_id uuid, p_action text, p_group_id uuid)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER := 0;
BEGIN
  CASE p_action
    WHEN 'add_member' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.group_members gm
      WHERE gm.group_id = p_group_id;
      
    WHEN 'group_created' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.groups g
      WHERE g.owner_id = p_user_id;
      
    WHEN 'expense_created' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.expenses e
      WHERE e.created_by = p_user_id
        AND e.created_at >= date_trunc('month', now());
        
    WHEN 'invite_sent' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.invites i
      WHERE i.created_by = p_user_id
        AND i.created_at >= date_trunc('month', now());
        
    WHEN 'ocr_used' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.receipt_ocr r
      WHERE r.created_by = p_user_id
        AND r.created_at >= date_trunc('month', now());
        
    ELSE
      v_count := 0;
  END CASE;
  
  RETURN v_count;
END;
$function$;

-- Update assert_quota function to enforce real limits
CREATE OR REPLACE FUNCTION public.assert_quota(p_action text, p_user_id uuid, p_group_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_plan TEXT;
  v_limit INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Get user's current plan
  v_plan := public.get_user_plan(p_user_id);
  
  -- Get the limit for this plan and action
  SELECT limit_value INTO v_limit
  FROM public.subscription_limits
  WHERE plan = v_plan AND action = p_action;
  
  -- If no limit found, allow (shouldn't happen with proper data)
  IF v_limit IS NULL THEN
    RETURN;
  END IF;
  
  -- Get current count
  v_current_count := public.get_current_count(p_user_id, p_action, p_group_id);
  
  -- Check if adding one more would exceed the limit
  IF v_current_count >= v_limit THEN
    CASE p_action
      WHEN 'add_member' THEN
        RAISE EXCEPTION 'quota_exceeded:لقد وصلت للحد الأقصى من الأعضاء (%) في باقة %. قم بالترقية لإضافة المزيد من الأعضاء.', v_limit, v_plan USING ERRCODE = 'P0001';
      WHEN 'group_created' THEN
        RAISE EXCEPTION 'quota_exceeded:لقد وصلت للحد الأقصى من المجموعات (%) في باقة %. قم بالترقية لإنشاء المزيد من المجموعات.', v_limit, v_plan USING ERRCODE = 'P0001';
      WHEN 'expense_created' THEN
        RAISE EXCEPTION 'quota_exceeded:لقد وصلت للحد الأقصى من المصروفات الشهرية (%) في باقة %. قم بالترقية لإضافة المزيد من المصروفات.', v_limit, v_plan USING ERRCODE = 'P0001';
      WHEN 'invite_sent' THEN
        RAISE EXCEPTION 'quota_exceeded:لقد وصلت للحد الأقصى من الدعوات الشهرية (%) في باقة %. قم بالترقية لإرسال المزيد من الدعوات.', v_limit, v_plan USING ERRCODE = 'P0001';
      WHEN 'ocr_used' THEN
        RAISE EXCEPTION 'quota_exceeded:لقد وصلت للحد الأقصى من استخدام OCR الشهري (%) في باقة %. قم بالترقية لاستخدام المزيد.', v_limit, v_plan USING ERRCODE = 'P0001';
      ELSE
        RAISE EXCEPTION 'quota_exceeded:لقد وصلت للحد الأقصى للباقة %. قم بالترقية للحصول على المزيد من الميزات.', v_plan USING ERRCODE = 'P0001';
    END CASE;
  END IF;
END;
$function$;