-- إنشاء دالة complete_subscription_purchase الجديدة
CREATE FUNCTION public.complete_subscription_purchase(
  p_purchase_id UUID,
  p_payment_reference TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase RECORD;
  v_existing_sub RECORD;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_plan_name TEXT;
  v_credits_granted INTEGER := 0;
BEGIN
  -- الحصول على بيانات الشراء
  SELECT sp.*, spl.name as plan_name, spl.credits_per_month
  INTO v_purchase
  FROM subscription_purchases sp
  LEFT JOIN subscription_plans spl ON sp.plan_id = spl.id
  WHERE sp.id = p_purchase_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Purchase not found');
  END IF;

  -- تحديث حالة الشراء
  UPDATE subscription_purchases
  SET status = 'completed',
      payment_id = p_payment_reference,
      completed_at = v_now
  WHERE id = p_purchase_id;

  -- حساب تاريخ انتهاء الاشتراك
  IF v_purchase.billing_cycle = 'yearly' THEN
    v_expires_at := v_now + INTERVAL '1 year';
  ELSE
    v_expires_at := v_now + INTERVAL '1 month';
  END IF;

  -- تحديد اسم الخطة بالشكل الصحيح
  v_plan_name := LOWER(COALESCE(v_purchase.plan_name, 'starter')) || '_' || COALESCE(v_purchase.billing_cycle, 'monthly');

  -- التحقق من وجود اشتراك سابق
  SELECT * INTO v_existing_sub
  FROM user_subscriptions
  WHERE user_id = v_purchase.user_id;

  IF FOUND THEN
    -- تحديث الاشتراك الموجود
    UPDATE user_subscriptions
    SET plan = v_plan_name::subscription_plan,
        status = 'active',
        started_at = v_now,
        expires_at = v_expires_at,
        last_credits_granted_at = v_now,
        updated_at = v_now
    WHERE user_id = v_purchase.user_id;
  ELSE
    -- إنشاء اشتراك جديد
    INSERT INTO user_subscriptions (user_id, plan, status, started_at, expires_at, last_credits_granted_at)
    VALUES (v_purchase.user_id, v_plan_name::subscription_plan, 'active', v_now, v_expires_at, v_now);
  END IF;

  -- منح الرصيد
  SELECT credits_granted INTO v_credits_granted
  FROM grant_subscription_credits(v_purchase.user_id, COALESCE(v_purchase.plan_name, 'Starter'));

  -- إنشاء الفاتورة
  PERFORM create_invoice_for_purchase(
    v_purchase.user_id,
    'subscription',
    p_purchase_id,
    v_purchase.price_paid,
    COALESCE(v_purchase.plan_name, 'Subscription') || ' (' || v_purchase.billing_cycle || ')',
    'اشتراك ' || COALESCE(v_purchase.plan_name, '') || ' (' || 
      CASE WHEN v_purchase.billing_cycle = 'yearly' THEN 'سنوي' ELSE 'شهري' END || ')',
    p_payment_reference,
    v_purchase.billing_cycle
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_granted', jsonb_build_object('credits_granted', v_credits_granted)
  );
END;
$$;

-- تفعيل اشتراك المستخدم المتضرر
INSERT INTO user_subscriptions (user_id, plan, status, started_at, expires_at, last_credits_granted_at)
SELECT 
  '096e33cc-68ab-4abb-9561-90a709a1f408',
  'starter_monthly'::subscription_plan,
  'active',
  NOW(),
  NOW() + INTERVAL '1 month',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM user_subscriptions 
  WHERE user_id = '096e33cc-68ab-4abb-9561-90a709a1f408'
);

-- منح 70 رصيد للمستخدم عبر usage_credits
INSERT INTO usage_credits (user_id, source, source_id, amount, consumed, expires_at, description_ar)
SELECT 
  '096e33cc-68ab-4abb-9561-90a709a1f408',
  'subscription',
  gen_random_uuid(),
  70,
  0,
  NOW() + INTERVAL '1 month',
  'رصيد اشتراك Starter'
WHERE NOT EXISTS (
  SELECT 1 FROM usage_credits 
  WHERE user_id = '096e33cc-68ab-4abb-9561-90a709a1f408'
  AND source = 'subscription'
  AND created_at > NOW() - INTERVAL '1 hour'
);