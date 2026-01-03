-- =============================================
-- Phase 1: UC System Complete Implementation (Final Fix)
-- =============================================

-- 1.1 Create user_daily_limits table for rewarded ads tracking
CREATE TABLE IF NOT EXISTS public.user_daily_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  rewarded_ads_count integer DEFAULT 0,
  last_ad_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.user_daily_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own daily limits" ON public.user_daily_limits;
DROP POLICY IF EXISTS "Users can insert their own daily limits" ON public.user_daily_limits;
DROP POLICY IF EXISTS "Users can update their own daily limits" ON public.user_daily_limits;

-- Policies for user_daily_limits
CREATE POLICY "Users can view their own daily limits"
ON public.user_daily_limits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily limits"
ON public.user_daily_limits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily limits"
ON public.user_daily_limits FOR UPDATE
USING (auth.uid() = user_id);

-- 1.2 Create rewarded_ad_sessions table
CREATE TABLE IF NOT EXISTS public.rewarded_ad_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  blocked_action text NOT NULL,
  required_uc integer NOT NULL,
  needed_uc integer NOT NULL,
  reward_uc integer DEFAULT 1,
  status text DEFAULT 'created' CHECK (status IN ('created','shown','rewarded','failed','expired')),
  provider text DEFAULT 'admob',
  ssv_nonce text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '10 minutes'
);

-- Enable RLS
ALTER TABLE public.rewarded_ad_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own ad sessions" ON public.rewarded_ad_sessions;
DROP POLICY IF EXISTS "Users can create their own ad sessions" ON public.rewarded_ad_sessions;
DROP POLICY IF EXISTS "Users can update their own ad sessions" ON public.rewarded_ad_sessions;

-- Policies for rewarded_ad_sessions
CREATE POLICY "Users can view their own ad sessions"
ON public.rewarded_ad_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ad sessions"
ON public.rewarded_ad_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ad sessions"
ON public.rewarded_ad_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- 1.3 Create admin_feature_flags table
CREATE TABLE IF NOT EXISTS public.admin_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name text UNIQUE NOT NULL,
  flag_value jsonb NOT NULL,
  description text,
  description_ar text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.admin_feature_flags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Feature flags are readable by everyone" ON public.admin_feature_flags;
DROP POLICY IF EXISTS "Admins can modify feature flags" ON public.admin_feature_flags;

-- Everyone can read feature flags
CREATE POLICY "Feature flags are readable by everyone"
ON public.admin_feature_flags FOR SELECT
USING (true);

-- Only admins can modify (using correct enum value 'admin')
CREATE POLICY "Admins can modify feature flags"
ON public.admin_feature_flags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 1.4 Add columns to referrals table
ALTER TABLE public.referrals 
  ADD COLUMN IF NOT EXISTS invited_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS qualified_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reward_activation_issued boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reward_qualification_issued boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reward_subscribe_bonus_issued boolean DEFAULT false;

-- 1.5 Insert default feature flags
INSERT INTO public.admin_feature_flags (flag_name, flag_value, description, description_ar) VALUES
  ('rewarded_ads_enabled', 'true', 'Enable rewarded ads feature', 'تفعيل ميزة الإعلانات المكافئة'),
  ('rewarded_uc_per_ad', '1', 'UC granted per rewarded ad', 'النقاط الممنوحة لكل إعلان'),
  ('rewarded_daily_cap', '5', 'Maximum rewarded ads per day', 'الحد الأقصى للإعلانات يومياً'),
  ('rewarded_cooldown_seconds', '180', 'Cooldown between ads in seconds', 'فترة الانتظار بين الإعلانات بالثواني'),
  ('referral_activation_uc', '10', 'UC for referral activation', 'نقاط تفعيل الدعوة'),
  ('referral_qualification_uc', '20', 'UC for referral qualification', 'نقاط تأهيل الدعوة'),
  ('referral_subscribe_bonus_uc', '60', 'Bonus UC when invited user subscribes', 'بونص اشتراك المدعو'),
  ('referral_subscribe_window_days', '14', 'Days window for subscribe bonus', 'فترة صلاحية بونص الاشتراك'),
  ('welcome_credits', '50', 'Welcome credits for new users', 'نقاط الترحيب للمستخدمين الجدد'),
  ('welcome_credits_validity_days', '7', 'Validity days for welcome credits', 'صلاحية نقاط الترحيب بالأيام'),
  ('daily_credits', '5', 'Daily credits grant', 'النقاط اليومية'),
  ('grace_period_days', '3', 'Grace period for subscription renewal', 'فترة السماح لتجديد الاشتراك')
ON CONFLICT (flag_name) DO NOTHING;

-- 1.6 Create function to check rewarded ad eligibility
CREATE OR REPLACE FUNCTION public.check_rewarded_ad_eligibility(
  p_user_id uuid,
  p_action text,
  p_required_uc integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_daily_cap integer;
  v_cooldown_seconds integer;
  v_ads_enabled boolean;
  v_current_count integer;
  v_last_ad_at timestamptz;
  v_available_credits integer;
  v_needed_uc integer;
  v_can_watch boolean;
  v_cooldown_remaining integer;
BEGIN
  SELECT (flag_value::text)::boolean INTO v_ads_enabled
  FROM admin_feature_flags WHERE flag_name = 'rewarded_ads_enabled';
  
  SELECT (flag_value::text)::integer INTO v_daily_cap
  FROM admin_feature_flags WHERE flag_name = 'rewarded_daily_cap';
  
  SELECT (flag_value::text)::integer INTO v_cooldown_seconds
  FROM admin_feature_flags WHERE flag_name = 'rewarded_cooldown_seconds';
  
  v_ads_enabled := COALESCE(v_ads_enabled, true);
  v_daily_cap := COALESCE(v_daily_cap, 5);
  v_cooldown_seconds := COALESCE(v_cooldown_seconds, 180);
  
  SELECT rewarded_ads_count, last_ad_at INTO v_current_count, v_last_ad_at
  FROM user_daily_limits
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  v_current_count := COALESCE(v_current_count, 0);
  
  SELECT COALESCE(total_available, 0) INTO v_available_credits
  FROM get_available_credits(p_user_id);
  
  v_needed_uc := GREATEST(0, p_required_uc - v_available_credits);
  
  IF v_last_ad_at IS NOT NULL THEN
    v_cooldown_remaining := GREATEST(0, 
      v_cooldown_seconds - EXTRACT(EPOCH FROM (now() - v_last_ad_at))::integer
    );
  ELSE
    v_cooldown_remaining := 0;
  END IF;
  
  v_can_watch := v_ads_enabled 
    AND v_current_count < v_daily_cap 
    AND v_cooldown_remaining = 0
    AND v_needed_uc > 0;
  
  RETURN jsonb_build_object(
    'can_watch', v_can_watch,
    'ads_enabled', v_ads_enabled,
    'daily_cap', v_daily_cap,
    'current_count', v_current_count,
    'remaining_today', v_daily_cap - v_current_count,
    'cooldown_remaining', v_cooldown_remaining,
    'available_credits', v_available_credits,
    'required_uc', p_required_uc,
    'needed_uc', v_needed_uc,
    'ads_needed', CEIL(v_needed_uc::numeric / 1)
  );
END;
$$;

-- 1.7 Create function to create rewarded ad session
CREATE OR REPLACE FUNCTION public.create_rewarded_ad_session(
  p_user_id uuid,
  p_action text,
  p_required_uc integer,
  p_group_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eligibility jsonb;
  v_session_id uuid;
  v_available_credits integer;
  v_needed_uc integer;
BEGIN
  v_eligibility := check_rewarded_ad_eligibility(p_user_id, p_action, p_required_uc);
  
  IF NOT (v_eligibility->>'can_watch')::boolean THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_eligible',
      'eligibility', v_eligibility
    );
  END IF;
  
  v_available_credits := (v_eligibility->>'available_credits')::integer;
  v_needed_uc := (v_eligibility->>'needed_uc')::integer;
  
  INSERT INTO rewarded_ad_sessions (
    user_id, group_id, blocked_action, required_uc, needed_uc, 
    reward_uc, status, ssv_nonce
  ) VALUES (
    p_user_id, p_group_id, p_action, p_required_uc, v_needed_uc,
    1, 'created', gen_random_uuid()::text
  )
  RETURNING id INTO v_session_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'needed_uc', v_needed_uc,
    'reward_uc', 1
  );
END;
$$;

-- 1.8 Create function to claim rewarded ad (idempotent)
CREATE OR REPLACE FUNCTION public.claim_rewarded_ad(
  p_session_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session rewarded_ad_sessions%ROWTYPE;
  v_reward_uc integer;
BEGIN
  SELECT * INTO v_session
  FROM rewarded_ad_sessions
  WHERE id = p_session_id AND user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_not_found');
  END IF;
  
  IF v_session.status = 'rewarded' THEN
    RETURN jsonb_build_object('success', true, 'already_claimed', true);
  END IF;
  
  IF v_session.expires_at < now() THEN
    UPDATE rewarded_ad_sessions SET status = 'expired' WHERE id = p_session_id;
    RETURN jsonb_build_object('success', false, 'error', 'session_expired');
  END IF;
  
  IF v_session.status NOT IN ('created', 'shown') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status');
  END IF;
  
  v_reward_uc := v_session.reward_uc;
  
  INSERT INTO usage_credits (user_id, amount, source, expires_at)
  VALUES (p_user_id, v_reward_uc, 'ad_reward', now() + interval '1 day');
  
  UPDATE rewarded_ad_sessions SET status = 'rewarded' WHERE id = p_session_id;
  
  INSERT INTO user_daily_limits (user_id, date, rewarded_ads_count, last_ad_at)
  VALUES (p_user_id, CURRENT_DATE, 1, now())
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    rewarded_ads_count = user_daily_limits.rewarded_ads_count + 1,
    last_ad_at = now(),
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'reward_uc', v_reward_uc,
    'already_claimed', false
  );
END;
$$;

-- 1.9 Create function to process referral milestones
CREATE OR REPLACE FUNCTION public.process_referral_milestone(
  p_invited_user_id uuid,
  p_milestone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral referrals%ROWTYPE;
  v_reward_uc integer;
  v_subscribe_window_days integer;
BEGIN
  SELECT * INTO v_referral
  FROM referrals
  WHERE invited_user_id = p_invited_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_referral_found');
  END IF;
  
  CASE p_milestone
    WHEN 'activated' THEN
      IF v_referral.reward_activation_issued THEN
        RETURN jsonb_build_object('success', false, 'error', 'already_issued');
      END IF;
      
      SELECT (flag_value::text)::integer INTO v_reward_uc
      FROM admin_feature_flags WHERE flag_name = 'referral_activation_uc';
      v_reward_uc := COALESCE(v_reward_uc, 10);
      
      UPDATE referrals 
      SET reward_activation_issued = true, activated_at = now() 
      WHERE id = v_referral.id;
      
    WHEN 'qualified' THEN
      IF v_referral.reward_qualification_issued THEN
        RETURN jsonb_build_object('success', false, 'error', 'already_issued');
      END IF;
      
      SELECT (flag_value::text)::integer INTO v_reward_uc
      FROM admin_feature_flags WHERE flag_name = 'referral_qualification_uc';
      v_reward_uc := COALESCE(v_reward_uc, 20);
      
      UPDATE referrals 
      SET reward_qualification_issued = true, qualified_at = now() 
      WHERE id = v_referral.id;
      
    WHEN 'subscribed' THEN
      IF v_referral.reward_subscribe_bonus_issued THEN
        RETURN jsonb_build_object('success', false, 'error', 'already_issued');
      END IF;
      
      SELECT (flag_value::text)::integer INTO v_subscribe_window_days
      FROM admin_feature_flags WHERE flag_name = 'referral_subscribe_window_days';
      v_subscribe_window_days := COALESCE(v_subscribe_window_days, 14);
      
      IF v_referral.created_at + (v_subscribe_window_days || ' days')::interval < now() THEN
        RETURN jsonb_build_object('success', false, 'error', 'subscribe_window_expired');
      END IF;
      
      SELECT (flag_value::text)::integer INTO v_reward_uc
      FROM admin_feature_flags WHERE flag_name = 'referral_subscribe_bonus_uc';
      v_reward_uc := COALESCE(v_reward_uc, 60);
      
      UPDATE referrals 
      SET reward_subscribe_bonus_issued = true, subscribed_at = now() 
      WHERE id = v_referral.id;
      
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'invalid_milestone');
  END CASE;
  
  INSERT INTO usage_credits (user_id, amount, source, expires_at)
  VALUES (v_referral.referrer_id, v_reward_uc, 'referral_' || p_milestone, now() + interval '30 days');
  
  RETURN jsonb_build_object(
    'success', true,
    'inviter_id', v_referral.referrer_id,
    'milestone', p_milestone,
    'reward_uc', v_reward_uc
  );
END;
$$;

-- 1.10 Create function to grant welcome credits
CREATE OR REPLACE FUNCTION public.grant_welcome_credits(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_welcome_uc integer;
  v_validity_days integer;
  v_existing_count integer;
BEGIN
  SELECT COUNT(*) INTO v_existing_count
  FROM usage_credits
  WHERE user_id = p_user_id AND source = 'welcome';
  
  IF v_existing_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_received');
  END IF;
  
  SELECT (flag_value::text)::integer INTO v_welcome_uc
  FROM admin_feature_flags WHERE flag_name = 'welcome_credits';
  v_welcome_uc := COALESCE(v_welcome_uc, 50);
  
  SELECT (flag_value::text)::integer INTO v_validity_days
  FROM admin_feature_flags WHERE flag_name = 'welcome_credits_validity_days';
  v_validity_days := COALESCE(v_validity_days, 7);
  
  INSERT INTO usage_credits (user_id, amount, source, expires_at)
  VALUES (p_user_id, v_welcome_uc, 'welcome', now() + (v_validity_days || ' days')::interval);
  
  RETURN jsonb_build_object(
    'success', true,
    'credits', v_welcome_uc,
    'validity_days', v_validity_days
  );
END;
$$;

-- 1.11 Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_daily_limits_user_date ON user_daily_limits(user_id, date);
CREATE INDEX IF NOT EXISTS idx_rewarded_ad_sessions_user ON rewarded_ad_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_rewarded_ad_sessions_status ON rewarded_ad_sessions(status);
CREATE INDEX IF NOT EXISTS idx_referrals_invited_user ON referrals(invited_user_id);

-- 1.12 Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_rewarded_ad_eligibility TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_rewarded_ad_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_rewarded_ad TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_referral_milestone TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_welcome_credits TO authenticated;