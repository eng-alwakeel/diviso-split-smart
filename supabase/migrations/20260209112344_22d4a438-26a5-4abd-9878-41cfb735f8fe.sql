
-- ============================================================
-- FIX 1: Add ownership validation to complete_credit_purchase
-- ============================================================
DROP FUNCTION IF EXISTS public.complete_credit_purchase(uuid, text);

CREATE FUNCTION public.complete_credit_purchase(
  p_purchase_id UUID,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase RECORD;
  v_package RECORD;
  v_invoice_id UUID;
BEGIN
  SELECT * INTO v_purchase
  FROM credit_purchases
  WHERE id = p_purchase_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Purchase not found or already completed');
  END IF;

  -- Ownership check
  IF v_purchase.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Purchase does not belong to user';
  END IF;
  
  SELECT * INTO v_package FROM credit_packages WHERE id = v_purchase.package_id;
  
  UPDATE credit_purchases
  SET status = 'completed', payment_reference = COALESCE(p_payment_reference, payment_reference), updated_at = NOW()
  WHERE id = p_purchase_id;
  
  UPDATE profiles
  SET credits_balance = COALESCE(credits_balance, 0) + v_purchase.credits_purchased, updated_at = NOW()
  WHERE id = v_purchase.user_id;
  
  v_invoice_id := create_invoice_for_purchase(
    v_purchase.user_id, 'credit', p_purchase_id, v_purchase.price_paid,
    COALESCE(v_package.name, 'Credit Package') || ' - ' || v_purchase.credits_purchased || ' Credits',
    COALESCE(v_package.name_ar, 'باقة نقاط') || ' - ' || v_purchase.credits_purchased || ' نقطة',
    p_payment_reference,
    NULL
  );
  
  RETURN jsonb_build_object('success', true, 'credits_added', v_purchase.credits_purchased, 'invoice_id', v_invoice_id);
END;
$$;

-- ============================================================
-- FIX 2: Add ownership validation to complete_subscription_purchase
-- ============================================================
DROP FUNCTION IF EXISTS public.complete_subscription_purchase(uuid, text);

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
  SELECT sp.*, spl.name as plan_name, spl.credits_per_month
  INTO v_purchase
  FROM subscription_purchases sp
  LEFT JOIN subscription_plans spl ON sp.plan_id = spl.id
  WHERE sp.id = p_purchase_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Purchase not found');
  END IF;

  -- Ownership check
  IF v_purchase.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Purchase does not belong to user';
  END IF;

  UPDATE subscription_purchases
  SET status = 'completed',
      payment_id = p_payment_reference,
      completed_at = v_now
  WHERE id = p_purchase_id;

  IF v_purchase.billing_cycle = 'yearly' THEN
    v_expires_at := v_now + INTERVAL '1 year';
  ELSE
    v_expires_at := v_now + INTERVAL '1 month';
  END IF;

  v_plan_name := LOWER(COALESCE(v_purchase.plan_name, 'starter')) || '_' || COALESCE(v_purchase.billing_cycle, 'monthly');

  SELECT * INTO v_existing_sub
  FROM user_subscriptions
  WHERE user_id = v_purchase.user_id;

  IF FOUND THEN
    UPDATE user_subscriptions
    SET plan = v_plan_name::subscription_plan,
        status = 'active',
        started_at = v_now,
        expires_at = v_expires_at,
        last_credits_granted_at = v_now,
        updated_at = v_now
    WHERE user_id = v_purchase.user_id;
  ELSE
    INSERT INTO user_subscriptions (user_id, plan, status, started_at, expires_at, last_credits_granted_at)
    VALUES (v_purchase.user_id, v_plan_name::subscription_plan, 'active', v_now, v_expires_at, v_now);
  END IF;

  SELECT credits_granted INTO v_credits_granted
  FROM grant_subscription_credits(v_purchase.user_id, COALESCE(v_purchase.plan_name, 'Starter'));

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

-- ============================================================
-- FIX 3: Restrict profiles SELECT policies to authenticated only
-- ============================================================
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON profiles;
CREATE POLICY "Profiles are viewable by owner" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Group members can view basic profile info" ON profiles;
CREATE POLICY "Group members can view basic profile info" ON profiles
  FOR SELECT TO authenticated
  USING (
    (id = auth.uid()) OR
    (EXISTS (
      SELECT 1
      FROM group_members gm_self
      JOIN group_members gm_other ON gm_self.group_id = gm_other.group_id
      WHERE gm_self.user_id = auth.uid() AND gm_other.user_id = profiles.id
    ))
  );

DROP POLICY IF EXISTS "Only admins can view all profiles" ON profiles;
CREATE POLICY "Only admins can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (is_admin_user() OR (id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view full profiles" ON profiles;
CREATE POLICY "Admins can view full profiles" ON profiles
  FOR SELECT TO authenticated
  USING (is_admin_user() AND (auth.uid() IS NOT NULL));

-- ============================================================
-- FIX 4: Restrict invoices policies to authenticated only
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
CREATE POLICY "Users can view their own invoices" ON invoices
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all invoices" ON invoices;
CREATE POLICY "Admins can view all invoices" ON invoices
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

DROP POLICY IF EXISTS "System can insert invoices" ON invoices;
CREATE POLICY "System can insert invoices" ON invoices
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update invoices" ON invoices;
CREATE POLICY "Admins can update invoices" ON invoices
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));
