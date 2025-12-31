-- =============================================
-- Phase 1: Credits & Rewards System - Database Setup
-- =============================================

-- 1. Usage Credits Table - نقاط الاستخدام
CREATE TABLE public.usage_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  source TEXT NOT NULL CHECK (source IN ('welcome', 'daily', 'subscription', 'purchase', 'conversion')),
  source_id UUID,
  description_ar TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed INTEGER DEFAULT 0 CHECK (consumed >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_consumption CHECK (consumed <= amount)
);

CREATE INDEX idx_usage_credits_user_valid ON public.usage_credits(user_id, expires_at) 
  WHERE consumed < amount;
CREATE INDEX idx_usage_credits_user_id ON public.usage_credits(user_id);

-- 2. Reward Points Table - نقاط المكافآت
CREATE TABLE public.reward_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  source TEXT NOT NULL CHECK (source IN ('daily_login', 'streak', 'referral', 'referral_quality', 'interaction', 'recommendation')),
  source_id UUID,
  description_ar TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reward_points_user_id ON public.reward_points(user_id);

-- 3. Reward Points Summary Table - ملخص نقاط المكافآت
CREATE TABLE public.reward_points_summary (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_earned INTEGER DEFAULT 0 CHECK (total_earned >= 0),
  total_converted INTEGER DEFAULT 0 CHECK (total_converted >= 0),
  available_balance INTEGER GENERATED ALWAYS AS (total_earned - total_converted) STORED,
  last_conversion_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Credit Packages Table - باقات الشراء
CREATE TABLE public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0),
  price_sar NUMERIC(10,2) NOT NULL CHECK (price_sar > 0),
  validity_days INTEGER NOT NULL CHECK (validity_days > 0),
  bonus_credits INTEGER DEFAULT 0 CHECK (bonus_credits >= 0),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Credit Purchases Table - سجل الشراء
CREATE TABLE public.credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.credit_packages(id),
  credits_purchased INTEGER NOT NULL CHECK (credits_purchased > 0),
  price_paid NUMERIC(10,2) NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_credit_purchases_user_id ON public.credit_purchases(user_id);

-- 6. Subscription Plans Table - خطط الاشتراك
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  price_sar NUMERIC(10,2) NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  credits_per_month INTEGER NOT NULL CHECK (credits_per_month > 0),
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Credit Consumption Log Table - سجل الاستهلاك
CREATE TABLE public.credit_consumption_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_id UUID REFERENCES public.usage_credits(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('ocr_scan', 'smart_category', 'recommendation', 'advanced_report', 'export', 'create_group', 'settlement')),
  amount_consumed INTEGER NOT NULL CHECK (amount_consumed > 0),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_credit_consumption_user_id ON public.credit_consumption_log(user_id);

-- =============================================
-- Insert Initial Data
-- =============================================

-- Credit Packages
INSERT INTO public.credit_packages (name, name_ar, credits, price_sar, validity_days, bonus_credits, sort_order) VALUES
('Starter', 'باقة البداية', 100, 25, 30, 0, 1),
('Popular', 'الأكثر شيوعاً', 200, 50, 45, 20, 2),
('Pro', 'باقة الاحتراف', 400, 100, 60, 80, 3);

-- Subscription Plans
INSERT INTO public.subscription_plans (name, name_ar, price_sar, billing_cycle, credits_per_month, features) VALUES
('pro_monthly', 'Pro شهري', 19, 'monthly', 90, '{"ai_priority": true, "smart_recommendations": true}'::jsonb),
('pro_yearly', 'Pro سنوي', 182, 'yearly', 90, '{"ai_priority": true, "smart_recommendations": true, "yearly_discount": 20}'::jsonb);

-- =============================================
-- Enable RLS
-- =============================================

ALTER TABLE public.usage_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_points_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_consumption_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies
-- =============================================

-- usage_credits
CREATE POLICY "Users can view own credits" ON public.usage_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert credits" ON public.usage_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- reward_points
CREATE POLICY "Users can view own rewards" ON public.reward_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert rewards" ON public.reward_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- reward_points_summary
CREATE POLICY "Users can view own summary" ON public.reward_points_summary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage summary" ON public.reward_points_summary
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- credit_packages (public read for active)
CREATE POLICY "Anyone can view active packages" ON public.credit_packages
  FOR SELECT USING (is_active = true);

-- credit_purchases
CREATE POLICY "Users can view own purchases" ON public.credit_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON public.credit_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- subscription_plans (public read for active)
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- credit_consumption_log
CREATE POLICY "Users can view own consumption" ON public.credit_consumption_log
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- Database Functions
-- =============================================

-- 1. Get Available Credits
CREATE OR REPLACE FUNCTION public.get_available_credits(p_user_id UUID)
RETURNS TABLE (
  total_available INTEGER,
  expiring_soon INTEGER,
  expiring_soon_date TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(uc.amount - uc.consumed)::INTEGER, 0) as total_available,
    COALESCE((
      SELECT SUM(uc2.amount - uc2.consumed)::INTEGER 
      FROM usage_credits uc2
      WHERE uc2.user_id = p_user_id 
        AND uc2.expires_at <= (now() + interval '3 days')
        AND uc2.expires_at > now()
        AND uc2.consumed < uc2.amount
    ), 0) as expiring_soon,
    (
      SELECT MIN(uc3.expires_at) 
      FROM usage_credits uc3
      WHERE uc3.user_id = p_user_id 
        AND uc3.expires_at > now()
        AND uc3.consumed < uc3.amount
    ) as expiring_soon_date
  FROM usage_credits uc
  WHERE uc.user_id = p_user_id
    AND uc.expires_at > now()
    AND uc.consumed < uc.amount;
END;
$$;

-- 2. Consume Credits (FIFO - oldest expiry first)
CREATE OR REPLACE FUNCTION public.consume_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_action_type TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_available INTEGER;
  v_remaining INTEGER;
  v_credit RECORD;
  v_consumed_from_credit INTEGER;
BEGIN
  -- Get available credits
  SELECT COALESCE(SUM(amount - consumed), 0)::INTEGER INTO v_available
  FROM usage_credits
  WHERE user_id = p_user_id
    AND expires_at > now()
    AND consumed < amount;

  IF v_available < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits',
      'available', v_available,
      'required', p_amount
    );
  END IF;

  v_remaining := p_amount;

  -- Consume from credits expiring soonest first (FIFO)
  FOR v_credit IN 
    SELECT id, amount, consumed, (amount - consumed) as available
    FROM usage_credits
    WHERE user_id = p_user_id
      AND expires_at > now()
      AND consumed < amount
    ORDER BY expires_at ASC
  LOOP
    IF v_remaining <= 0 THEN EXIT; END IF;

    v_consumed_from_credit := LEAST(v_remaining, v_credit.available);

    UPDATE usage_credits
    SET consumed = consumed + v_consumed_from_credit
    WHERE id = v_credit.id;

    -- Log consumption
    INSERT INTO credit_consumption_log (user_id, credit_id, action_type, amount_consumed, metadata)
    VALUES (p_user_id, v_credit.id, p_action_type, v_consumed_from_credit, p_metadata);

    v_remaining := v_remaining - v_consumed_from_credit;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'consumed', p_amount,
    'remaining_balance', v_available - p_amount
  );
END;
$$;

-- 3. Add Reward Points
CREATE OR REPLACE FUNCTION public.add_reward_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_description_ar TEXT DEFAULT NULL,
  p_source_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Insert reward points
  INSERT INTO reward_points (user_id, amount, source, source_id, description_ar, metadata)
  VALUES (p_user_id, p_amount, p_source, p_source_id, p_description_ar, p_metadata);

  -- Update or create summary
  INSERT INTO reward_points_summary (user_id, total_earned)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE SET
    total_earned = reward_points_summary.total_earned + p_amount,
    updated_at = now();

  -- Get new balance
  SELECT available_balance INTO v_new_balance
  FROM reward_points_summary WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'points_added', p_amount,
    'new_balance', v_new_balance
  );
END;
$$;

-- 4. Convert Rewards to Credits (10 RP = 5 UC, once per 24h)
CREATE OR REPLACE FUNCTION public.convert_rewards_to_credits(p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_available_rp INTEGER;
  v_last_conversion TIMESTAMPTZ;
  v_rp_to_convert INTEGER;
  v_uc_to_add INTEGER;
BEGIN
  -- Check last conversion (24h cooldown)
  SELECT last_conversion_at, available_balance 
  INTO v_last_conversion, v_available_rp
  FROM reward_points_summary 
  WHERE user_id = p_user_id;

  IF v_last_conversion IS NOT NULL AND v_last_conversion > (now() - interval '24 hours') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'conversion_cooldown',
      'next_available', v_last_conversion + interval '24 hours'
    );
  END IF;

  IF v_available_rp IS NULL OR v_available_rp < 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_reward_points',
      'available', COALESCE(v_available_rp, 0),
      'required', 10
    );
  END IF;

  -- Calculate conversion: 10 RP = 5 UC
  v_rp_to_convert := (v_available_rp / 10) * 10;
  v_uc_to_add := v_rp_to_convert / 2;

  -- Update rewards summary
  UPDATE reward_points_summary SET
    total_converted = total_converted + v_rp_to_convert,
    last_conversion_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Add usage credits (7 days validity)
  INSERT INTO usage_credits (user_id, amount, source, description_ar, expires_at)
  VALUES (
    p_user_id, 
    v_uc_to_add, 
    'conversion',
    'تحويل من نقاط المكافآت',
    now() + interval '7 days'
  );

  RETURN jsonb_build_object(
    'success', true,
    'rp_converted', v_rp_to_convert,
    'uc_received', v_uc_to_add,
    'uc_expires_at', now() + interval '7 days'
  );
END;
$$;

-- 5. Grant Welcome Credits (50 UC, 7 days)
CREATE OR REPLACE FUNCTION public.grant_welcome_credits(p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_existing INTEGER;
BEGIN
  -- Check if already received welcome credits
  SELECT COUNT(*) INTO v_existing
  FROM usage_credits
  WHERE user_id = p_user_id AND source = 'welcome';

  IF v_existing > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_received'
    );
  END IF;

  -- Grant 50 welcome credits (7 days validity)
  INSERT INTO usage_credits (user_id, amount, source, description_ar, expires_at)
  VALUES (p_user_id, 50, 'welcome', 'نقاط ترحيبية', now() + interval '7 days');

  RETURN jsonb_build_object(
    'success', true,
    'credits_granted', 50,
    'expires_at', now() + interval '7 days'
  );
END;
$$;

-- 6. Grant Daily Credits (5 UC, 1 day - no stacking)
CREATE OR REPLACE FUNCTION public.grant_daily_credits(p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_existing INTEGER;
BEGIN
  -- Check if already claimed today
  SELECT COUNT(*) INTO v_existing
  FROM usage_credits
  WHERE user_id = p_user_id 
    AND source = 'daily'
    AND DATE(created_at) = v_today;

  IF v_existing > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_claimed_today'
    );
  END IF;

  -- Grant 5 daily credits (1 day validity - no stacking)
  INSERT INTO usage_credits (user_id, amount, source, description_ar, expires_at)
  VALUES (p_user_id, 5, 'daily', 'نقاط يومية', now() + interval '1 day');

  RETURN jsonb_build_object(
    'success', true,
    'credits_granted', 5,
    'expires_at', now() + interval '1 day'
  );
END;
$$;

-- 7. Grant Subscription Credits
CREATE OR REPLACE FUNCTION public.grant_subscription_credits(
  p_user_id UUID,
  p_plan_name TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_credits_per_month INTEGER;
  v_billing_cycle TEXT;
  v_expiry TIMESTAMPTZ;
BEGIN
  -- Get plan details
  SELECT credits_per_month, billing_cycle
  INTO v_credits_per_month, v_billing_cycle
  FROM subscription_plans
  WHERE name = p_plan_name AND is_active = true;

  IF v_credits_per_month IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'plan_not_found'
    );
  END IF;

  -- Set expiry based on billing cycle
  v_expiry := CASE 
    WHEN v_billing_cycle = 'yearly' THEN now() + interval '1 month'
    ELSE now() + interval '1 month'
  END;

  -- Grant credits
  INSERT INTO usage_credits (user_id, amount, source, description_ar, expires_at)
  VALUES (
    p_user_id, 
    v_credits_per_month, 
    'subscription',
    'نقاط اشتراك Pro',
    v_expiry
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_granted', v_credits_per_month,
    'expires_at', v_expiry
  );
END;
$$;

-- 8. Check if user can perform action (helper function)
CREATE OR REPLACE FUNCTION public.can_perform_action(
  p_user_id UUID,
  p_action_type TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cost INTEGER;
  v_available INTEGER;
BEGIN
  -- Get action cost
  v_cost := CASE p_action_type
    WHEN 'ocr_scan' THEN 1
    WHEN 'smart_category' THEN 1
    WHEN 'recommendation' THEN 1
    WHEN 'advanced_report' THEN 2
    WHEN 'export' THEN 1
    WHEN 'create_group' THEN 5
    WHEN 'settlement' THEN 3
    ELSE 0
  END;

  -- Free actions
  IF v_cost = 0 THEN
    RETURN jsonb_build_object('can_perform', true, 'cost', 0, 'available', 0);
  END IF;

  -- Get available credits
  SELECT COALESCE(SUM(amount - consumed), 0)::INTEGER INTO v_available
  FROM usage_credits
  WHERE user_id = p_user_id
    AND expires_at > now()
    AND consumed < amount;

  RETURN jsonb_build_object(
    'can_perform', v_available >= v_cost,
    'cost', v_cost,
    'available', v_available
  );
END;
$$;