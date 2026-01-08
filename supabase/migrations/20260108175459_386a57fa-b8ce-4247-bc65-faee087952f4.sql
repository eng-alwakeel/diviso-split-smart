-- =============================================
-- نظام Credits النهائي (Lovable-like)
-- =============================================

-- 1. جدول one_time_action_tokens للإعلانات والإحالات
CREATE TABLE IF NOT EXISTS public.one_time_action_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('rewarded_ad', 'referral', 'promo')),
  source_session_id UUID,
  action_type TEXT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_one_time_tokens_user_valid 
  ON one_time_action_tokens(user_id, is_used, expires_at);

-- RLS
ALTER TABLE one_time_action_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tokens" ON one_time_action_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can use own tokens" ON one_time_action_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. جدول حدود الإحالة لكل دورة
CREATE TABLE IF NOT EXISTS public.referral_cycle_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  billing_cycle_start DATE NOT NULL,
  referral_credits_granted INTEGER DEFAULT 0,
  max_referral_credits INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, billing_cycle_start)
);

ALTER TABLE referral_cycle_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral limits" ON referral_cycle_limits
  FOR SELECT USING (auth.uid() = user_id);

-- 3. جدول حدود Top-Up لكل دورة
CREATE TABLE IF NOT EXISTS public.topup_cycle_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  billing_cycle_start DATE NOT NULL,
  topup_count INTEGER DEFAULT 0,
  max_topup_per_cycle INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, billing_cycle_start)
);

ALTER TABLE topup_cycle_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own topup limits" ON topup_cycle_limits
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- Functions
-- =============================================

-- 4. إنشاء Ad Action Token
CREATE OR REPLACE FUNCTION public.create_ad_action_token(
  p_user_id UUID,
  p_action_type TEXT,
  p_session_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_id UUID;
BEGIN
  -- إنشاء token جديد صالح لـ 30 دقيقة
  INSERT INTO one_time_action_tokens (user_id, source, source_session_id, action_type, expires_at)
  VALUES (p_user_id, 'rewarded_ad', p_session_id, p_action_type, now() + interval '30 minutes')
  RETURNING id INTO v_token_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'token_id', v_token_id,
    'expires_in_minutes', 30
  );
END;
$$;

-- 5. خصم Credits مع FEFO (First Expiring First Out)
CREATE OR REPLACE FUNCTION public.deduct_credits_fefo(
  p_user_id UUID,
  p_amount INTEGER,
  p_action_type TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token RECORD;
  v_remaining INTEGER := p_amount;
  v_credit RECORD;
  v_total_deducted INTEGER := 0;
BEGIN
  -- 1. أولاً: تحقق من وجود Ad Token صالح
  SELECT * INTO v_token FROM one_time_action_tokens
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND is_used = false
    AND expires_at > now()
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF v_token.id IS NOT NULL THEN
    -- استخدم الـ token
    UPDATE one_time_action_tokens 
    SET is_used = true, used_at = now()
    WHERE id = v_token.id;
    
    -- سجل الاستهلاك
    INSERT INTO credit_consumption_log (user_id, action_type, amount_consumed, metadata)
    VALUES (p_user_id, p_action_type, 0, jsonb_build_object('method', 'ad_token', 'token_id', v_token.id));
    
    RETURN jsonb_build_object(
      'success', true,
      'method', 'ad_token',
      'token_id', v_token.id
    );
  END IF;
  
  -- 2. خصم FEFO من Credits
  FOR v_credit IN 
    SELECT * FROM usage_credits
    WHERE user_id = p_user_id
      AND expires_at > now()
      AND (amount - consumed) > 0
    ORDER BY expires_at ASC -- First Expiring First Out
  LOOP
    IF v_remaining <= 0 THEN EXIT; END IF;
    
    DECLARE
      v_available INTEGER := v_credit.amount - v_credit.consumed;
      v_to_consume INTEGER := LEAST(v_available, v_remaining);
    BEGIN
      UPDATE usage_credits 
      SET consumed = consumed + v_to_consume
      WHERE id = v_credit.id;
      
      v_total_deducted := v_total_deducted + v_to_consume;
      v_remaining := v_remaining - v_to_consume;
    END;
  END LOOP;
  
  IF v_remaining > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits',
      'shortfall', v_remaining,
      'deducted', v_total_deducted
    );
  END IF;
  
  -- سجل الاستهلاك
  INSERT INTO credit_consumption_log (user_id, action_type, amount_consumed, metadata)
  VALUES (p_user_id, p_action_type, p_amount, jsonb_build_object('method', 'credits_deducted'));
  
  RETURN jsonb_build_object(
    'success', true,
    'method', 'credits_deducted',
    'amount', p_amount
  );
END;
$$;

-- 6. منح نقاط الإحالة مع حدود الدورة
CREATE OR REPLACE FUNCTION public.grant_referral_credit_limited(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_billing_start DATE;
  v_current_count INTEGER := 0;
  v_max_count INTEGER := 5;
  v_expires_at TIMESTAMPTZ;
  v_sub RECORD;
BEGIN
  -- جلب الاشتراك الحالي
  SELECT * INTO v_sub FROM user_subscriptions 
  WHERE user_id = p_user_id AND status IN ('active', 'trialing')
  LIMIT 1;
  
  -- حساب بداية الدورة الحالية
  IF v_sub IS NOT NULL THEN
    v_billing_start := date_trunc('month', COALESCE(v_sub.started_at, now()))::date;
    v_expires_at := v_sub.expires_at;
  ELSE
    v_billing_start := date_trunc('month', now())::date;
    v_expires_at := (v_billing_start + interval '1 month')::timestamptz;
  END IF;
  
  -- التحقق من الحد الحالي
  SELECT COALESCE(referral_credits_granted, 0), COALESCE(max_referral_credits, 5)
  INTO v_current_count, v_max_count
  FROM referral_cycle_limits
  WHERE user_id = p_user_id AND billing_cycle_start = v_billing_start;
  
  IF v_current_count >= v_max_count THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'referral_limit_reached',
      'current', v_current_count,
      'max', v_max_count
    );
  END IF;
  
  -- منح النقاط
  INSERT INTO usage_credits (user_id, amount, source, description_ar, expires_at)
  VALUES (p_user_id, p_amount, 'referral', 'مكافأة إحالة صديق', v_expires_at);
  
  -- تحديث العداد
  INSERT INTO referral_cycle_limits (user_id, billing_cycle_start, referral_credits_granted)
  VALUES (p_user_id, v_billing_start, p_amount)
  ON CONFLICT (user_id, billing_cycle_start) 
  DO UPDATE SET referral_credits_granted = referral_cycle_limits.referral_credits_granted + p_amount;
  
  RETURN jsonb_build_object(
    'success', true,
    'credits_granted', p_amount,
    'remaining_referrals', v_max_count - v_current_count - p_amount
  );
END;
$$;

-- 7. التحقق من حدود الإحالة
CREATE OR REPLACE FUNCTION public.get_referral_limits(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_billing_start DATE;
  v_current_count INTEGER := 0;
  v_max_count INTEGER := 5;
BEGIN
  v_billing_start := date_trunc('month', now())::date;
  
  SELECT COALESCE(referral_credits_granted, 0), COALESCE(max_referral_credits, 5)
  INTO v_current_count, v_max_count
  FROM referral_cycle_limits
  WHERE user_id = p_user_id AND billing_cycle_start = v_billing_start;
  
  RETURN jsonb_build_object(
    'used', COALESCE(v_current_count, 0),
    'max', v_max_count,
    'remaining', v_max_count - COALESCE(v_current_count, 0)
  );
END;
$$;

-- 8. التحقق من وجود Ad Token صالح
CREATE OR REPLACE FUNCTION public.check_valid_ad_token(
  p_user_id UUID,
  p_action_type TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token RECORD;
BEGIN
  SELECT * INTO v_token FROM one_time_action_tokens
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND is_used = false
    AND expires_at > now()
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF v_token.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'has_token', true,
      'token_id', v_token.id,
      'expires_at', v_token.expires_at,
      'minutes_remaining', EXTRACT(EPOCH FROM (v_token.expires_at - now())) / 60
    );
  END IF;
  
  RETURN jsonb_build_object('has_token', false);
END;
$$;