-- Drop existing functions to allow recreation with different return types
DROP FUNCTION IF EXISTS complete_credit_purchase(UUID, TEXT);
DROP FUNCTION IF EXISTS complete_subscription_purchase(UUID, TEXT);
DROP FUNCTION IF EXISTS create_invoice_for_purchase(UUID, TEXT, UUID, NUMERIC, TEXT, TEXT, TEXT);

-- Recreate create_invoice_for_purchase with billing_cycle parameter
CREATE OR REPLACE FUNCTION create_invoice_for_purchase(
  p_user_id UUID,
  p_purchase_type TEXT,
  p_purchase_id UUID,
  p_amount NUMERIC,
  p_description TEXT,
  p_description_ar TEXT,
  p_payment_reference TEXT DEFAULT NULL,
  p_billing_cycle TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_user_email TEXT;
  v_user_phone TEXT;
  v_user_name TEXT;
  v_total_excl_vat NUMERIC;
  v_total_vat NUMERIC;
  v_vat_rate NUMERIC := 0.15;
  v_item_type TEXT;
BEGIN
  SELECT p.name, p.phone
  INTO v_user_name, v_user_phone
  FROM profiles p
  WHERE p.id = p_user_id;
  
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  v_total_excl_vat := ROUND(p_amount / (1 + v_vat_rate), 2);
  v_total_vat := ROUND(p_amount - v_total_excl_vat, 2);
  
  v_invoice_number := generate_invoice_number();
  
  IF p_purchase_type = 'credit' THEN
    v_item_type := 'credits_pack';
  ELSIF p_purchase_type = 'subscription' THEN
    IF p_billing_cycle = 'monthly' THEN
      v_item_type := 'subscription_monthly';
    ELSE
      v_item_type := 'subscription_annual';
    END IF;
  ELSE
    v_item_type := 'credits_pack';
  END IF;
  
  INSERT INTO invoices (
    invoice_number, invoice_type, user_id, buyer_email, buyer_name, buyer_phone,
    seller_legal_name, seller_vat_number, seller_address,
    payment_status, payment_provider, payment_txn_id, currency,
    total_excl_vat, total_vat, total_incl_vat, vat_rate, issue_datetime,
    credit_purchase_id, subscription_id
  ) VALUES (
    v_invoice_number, 'simplified_tax_invoice', p_user_id, v_user_email, v_user_name, v_user_phone,
    'Diviso App', '311234567890003', 'Riyadh, Saudi Arabia',
    'paid', 'moyasar', p_payment_reference, 'SAR',
    v_total_excl_vat, v_total_vat, p_amount, v_vat_rate * 100, NOW(),
    CASE WHEN p_purchase_type = 'credit' THEN p_purchase_id ELSE NULL END,
    CASE WHEN p_purchase_type = 'subscription' THEN p_purchase_id ELSE NULL END
  )
  RETURNING id INTO v_invoice_id;
  
  INSERT INTO invoice_items (
    invoice_id, item_type, description, description_ar, quantity,
    unit_price_excl_vat, vat_rate, vat_amount, line_total_incl_vat
  ) VALUES (
    v_invoice_id, v_item_type, p_description, p_description_ar, 1,
    v_total_excl_vat, v_vat_rate * 100, v_total_vat, p_amount
  );
  
  RETURN v_invoice_id;
END;
$$;

-- Recreate complete_credit_purchase
CREATE OR REPLACE FUNCTION complete_credit_purchase(
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

-- Recreate complete_subscription_purchase
CREATE OR REPLACE FUNCTION complete_subscription_purchase(
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
  v_plan RECORD;
  v_subscription_id UUID;
  v_invoice_id UUID;
  v_start_date TIMESTAMPTZ;
  v_end_date TIMESTAMPTZ;
  v_billing_cycle_ar TEXT;
BEGIN
  SELECT * INTO v_purchase
  FROM subscription_purchases
  WHERE id = p_purchase_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Purchase not found or already completed');
  END IF;
  
  SELECT * INTO v_plan FROM subscription_plans WHERE id = v_purchase.plan_id;
  
  v_start_date := NOW();
  IF v_purchase.billing_cycle = 'monthly' THEN
    v_end_date := v_start_date + INTERVAL '1 month';
    v_billing_cycle_ar := 'شهري';
  ELSE
    v_end_date := v_start_date + INTERVAL '1 year';
    v_billing_cycle_ar := 'سنوي';
  END IF;
  
  UPDATE subscription_purchases
  SET status = 'completed', payment_reference = COALESCE(p_payment_reference, payment_reference), updated_at = NOW()
  WHERE id = p_purchase_id;
  
  INSERT INTO user_subscriptions (user_id, plan_id, status, billing_cycle, current_period_start, current_period_end, credits_remaining)
  VALUES (v_purchase.user_id, v_purchase.plan_id, 'active', v_purchase.billing_cycle, v_start_date, v_end_date, v_plan.credits_per_month)
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id, status = 'active', billing_cycle = EXCLUDED.billing_cycle,
    current_period_start = EXCLUDED.current_period_start, current_period_end = EXCLUDED.current_period_end,
    credits_remaining = user_subscriptions.credits_remaining + v_plan.credits_per_month, updated_at = NOW()
  RETURNING id INTO v_subscription_id;
  
  UPDATE profiles
  SET credits_balance = COALESCE(credits_balance, 0) + v_plan.credits_per_month, updated_at = NOW()
  WHERE id = v_purchase.user_id;
  
  v_invoice_id := create_invoice_for_purchase(
    v_purchase.user_id, 'subscription', p_purchase_id, v_purchase.price_paid,
    v_plan.name || ' Subscription (' || v_purchase.billing_cycle || ')',
    'اشتراك ' || v_plan.name || ' (' || v_billing_cycle_ar || ')',
    p_payment_reference,
    v_purchase.billing_cycle
  );
  
  RETURN jsonb_build_object('success', true, 'subscription_id', v_subscription_id, 'credits_added', v_plan.credits_per_month, 'invoice_id', v_invoice_id);
END;
$$;

-- Create invoices for existing completed credit purchases
DO $$
DECLARE
  v_purchase RECORD;
  v_package RECORD;
BEGIN
  FOR v_purchase IN 
    SELECT cp.* FROM credit_purchases cp
    WHERE cp.status = 'completed'
    AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.credit_purchase_id = cp.id)
  LOOP
    SELECT * INTO v_package FROM credit_packages WHERE id = v_purchase.package_id;
    
    PERFORM create_invoice_for_purchase(
      v_purchase.user_id, 'credit', v_purchase.id, v_purchase.price_paid,
      COALESCE(v_package.name, 'Credit Package') || ' - ' || v_purchase.credits_purchased || ' Credits',
      COALESCE(v_package.name_ar, 'باقة نقاط') || ' - ' || v_purchase.credits_purchased || ' نقطة',
      v_purchase.payment_reference,
      NULL
    );
  END LOOP;
END;
$$;