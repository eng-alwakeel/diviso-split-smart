-- Update personal plan limits to unlimited (-1 means unlimited)
UPDATE public.subscription_limits 
SET limit_value = -1 
WHERE plan = 'personal' AND action IN ('add_member', 'group_created');

-- Update assert_quota function to handle unlimited limits
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
  
  -- If limit is -1, it means unlimited, so allow
  IF v_limit = -1 THEN
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