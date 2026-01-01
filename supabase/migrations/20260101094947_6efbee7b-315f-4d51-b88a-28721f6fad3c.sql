-- ============================================
-- تحديث نظام النقاط والاشتراكات الجديد
-- ============================================

-- 1. حذف الخطط القديمة وإضافة الجديدة
DELETE FROM subscription_plans;

INSERT INTO subscription_plans (name, name_ar, billing_cycle, price_sar, credits_per_month, features, is_active) VALUES
-- الشهري
('starter_monthly', 'Starter شهري', 'monthly', 19, 70, '{"tier": "starter"}', true),
('pro_monthly', 'Pro شهري', 'monthly', 29, 90, '{"tier": "pro", "decoy": true}', true),
('max_monthly', 'Max شهري', 'monthly', 39, 260, '{"tier": "max", "featured": true}', true),
-- السنوي
('starter_yearly', 'Starter سنوي', 'yearly', 189, 90, '{"tier": "starter", "discount": 17}', true),
('pro_yearly', 'Pro سنوي', 'yearly', 239, 160, '{"tier": "pro", "decoy": true, "discount": 31}', true),
('max_yearly', 'Max سنوي', 'yearly', 299, 260, '{"tier": "max", "featured": true, "discount": 36}', true);

-- 2. تحديث جدول credit_packages بالباقات S/M/L
DELETE FROM credit_packages;

INSERT INTO credit_packages (name, name_ar, price_sar, credits, bonus_credits, validity_days, is_active, sort_order) VALUES
('Large', 'أفضل قيمة', 99, 450, 0, 90, true, 1),
('Medium', 'الأكثر شيوعاً', 49, 200, 0, 60, true, 2),
('Small', 'مرونة', 25, 90, 0, 30, true, 3);

-- 3. إضافة أعمدة الإحالة الجديدة
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS uc_stage TEXT DEFAULT 'registered';
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS uc_earned INTEGER DEFAULT 0;

-- 4. إنشاء function لمنح نقاط الإحالة حسب المرحلة
CREATE OR REPLACE FUNCTION grant_referral_stage_bonus(
  p_inviter_id UUID,
  p_invited_user_id UUID,
  p_stage TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bonus INTEGER := 0;
  v_current_stage TEXT;
  v_referral_id UUID;
BEGIN
  SELECT id, uc_stage INTO v_referral_id, v_current_stage
  FROM referrals
  WHERE inviter_id = p_inviter_id 
    AND invited_user_id = p_invited_user_id
  LIMIT 1;
  
  IF v_referral_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'referral_not_found');
  END IF;
  
  CASE p_stage
    WHEN 'first_usage' THEN
      IF v_current_stage = 'registered' THEN
        v_bonus := 10;
      END IF;
    WHEN 'qualified' THEN
      IF v_current_stage IN ('registered', 'first_usage') THEN
        IF v_current_stage = 'registered' THEN
          v_bonus := 30;
        ELSE
          v_bonus := 20;
        END IF;
      END IF;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'invalid_stage');
  END CASE;
  
  IF v_bonus = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'stage_already_completed');
  END IF;
  
  INSERT INTO usage_credits (user_id, amount, source, expires_at)
  VALUES (p_inviter_id, v_bonus, 'referral', NOW() + INTERVAL '90 days');
  
  UPDATE referrals 
  SET uc_stage = p_stage,
      uc_earned = COALESCE(uc_earned, 0) + v_bonus,
      updated_at = NOW()
  WHERE id = v_referral_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'bonus_granted', v_bonus,
    'new_stage', p_stage
  );
END;
$$;

-- 5. إنشاء function للتحقق من إمكانية تنفيذ عملية (مع gating)
CREATE OR REPLACE FUNCTION check_can_perform_gated_action(
  p_user_id UUID,
  p_action_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_credits INTEGER;
  v_action_cost INTEGER;
  v_is_gated BOOLEAN;
BEGIN
  CASE p_action_type
    WHEN 'add_expense' THEN v_action_cost := 0; v_is_gated := true;
    WHEN 'create_group' THEN v_action_cost := 5; v_is_gated := true;
    WHEN 'settlement' THEN v_action_cost := 3; v_is_gated := true;
    WHEN 'ocr_scan' THEN v_action_cost := 1; v_is_gated := true;
    WHEN 'smart_category' THEN v_action_cost := 1; v_is_gated := true;
    WHEN 'recommendation' THEN v_action_cost := 1; v_is_gated := true;
    WHEN 'advanced_report' THEN v_action_cost := 2; v_is_gated := true;
    WHEN 'export_pdf' THEN v_action_cost := 1; v_is_gated := true;
    WHEN 'view_data' THEN v_action_cost := 0; v_is_gated := false;
    ELSE v_action_cost := 0; v_is_gated := false;
  END CASE;
  
  SELECT COALESCE(SUM(amount), 0) INTO v_total_credits
  FROM usage_credits
  WHERE user_id = p_user_id 
    AND (expires_at IS NULL OR expires_at > NOW());
  
  IF v_is_gated AND v_total_credits = 0 THEN
    RETURN jsonb_build_object(
      'can_perform', false,
      'blocked', true,
      'reason', 'zero_credits',
      'total_credits', 0,
      'action_cost', v_action_cost
    );
  END IF;
  
  IF v_action_cost > v_total_credits THEN
    RETURN jsonb_build_object(
      'can_perform', false,
      'blocked', false,
      'reason', 'insufficient_credits',
      'total_credits', v_total_credits,
      'action_cost', v_action_cost,
      'shortfall', v_action_cost - v_total_credits
    );
  END IF;
  
  RETURN jsonb_build_object(
    'can_perform', true,
    'blocked', false,
    'total_credits', v_total_credits,
    'action_cost', v_action_cost
  );
END;
$$;