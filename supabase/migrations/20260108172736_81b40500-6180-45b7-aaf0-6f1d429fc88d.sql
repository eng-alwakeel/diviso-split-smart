-- Add last_credits_granted_at column to user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS last_credits_granted_at TIMESTAMPTZ;

-- Update existing active subscriptions to set last_credits_granted_at
UPDATE public.user_subscriptions 
SET last_credits_granted_at = started_at
WHERE status = 'active' AND last_credits_granted_at IS NULL;

-- Create complete_subscription_purchase function
CREATE OR REPLACE FUNCTION public.complete_subscription_purchase(
  p_purchase_id UUID,
  p_payment_reference TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase RECORD;
  v_plan_name TEXT;
  v_credits_per_month INTEGER;
  v_now TIMESTAMPTZ := now();
  v_expires_at TIMESTAMPTZ;
  v_grant_result JSONB;
BEGIN
  -- Get purchase details with plan info
  SELECT 
    sp.*,
    sub.name as plan_name,
    sub.credits_per_month
  INTO v_purchase
  FROM subscription_purchases sp
  JOIN subscription_plans sub ON sub.id = sp.plan_id
  WHERE sp.id = p_purchase_id AND sp.status = 'pending';

  IF v_purchase IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'purchase_not_found_or_already_processed'
    );
  END IF;

  v_plan_name := v_purchase.plan_name;
  v_credits_per_month := v_purchase.credits_per_month;

  -- Calculate expiry date
  IF v_purchase.billing_cycle = 'yearly' THEN
    v_expires_at := v_now + interval '1 year';
  ELSE
    v_expires_at := v_now + interval '1 month';
  END IF;

  -- Update purchase status
  UPDATE subscription_purchases 
  SET status = 'completed',
      payment_id = p_payment_reference,
      completed_at = v_now
  WHERE id = p_purchase_id;

  -- Map plan name to valid type
  v_plan_name := CASE 
    WHEN lower(v_plan_name) IN ('family', 'max') THEN 'family'
    WHEN lower(v_plan_name) = 'lifetime' THEN 'lifetime'
    ELSE 'personal'
  END;

  -- Create or update subscription
  INSERT INTO user_subscriptions (
    user_id, 
    plan, 
    status, 
    billing_cycle,
    started_at, 
    expires_at,
    next_renewal_date,
    auto_renew,
    last_credits_granted_at,
    updated_at
  )
  VALUES (
    v_purchase.user_id,
    v_plan_name::subscription_plan,
    'active',
    v_purchase.billing_cycle,
    v_now,
    v_expires_at,
    v_expires_at,
    true,
    v_now,
    v_now
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan = EXCLUDED.plan,
    status = 'active',
    billing_cycle = EXCLUDED.billing_cycle,
    started_at = EXCLUDED.started_at,
    expires_at = EXCLUDED.expires_at,
    next_renewal_date = EXCLUDED.next_renewal_date,
    auto_renew = true,
    last_credits_granted_at = EXCLUDED.last_credits_granted_at,
    updated_at = EXCLUDED.updated_at;

  -- Grant subscription credits
  SELECT grant_subscription_credits(v_purchase.user_id, v_purchase.plan_name) INTO v_grant_result;

  -- Create notification
  INSERT INTO notifications (user_id, type, title_ar, message_ar)
  VALUES (
    v_purchase.user_id,
    'subscription',
    'تم تفعيل اشتراكك!',
    'مرحباً! تم تفعيل اشتراكك بنجاح وإضافة ' || v_credits_per_month || ' نقطة إلى رصيدك.'
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_purchase.user_id,
    'plan', v_plan_name,
    'credits_granted', v_grant_result,
    'expires_at', v_expires_at
  );
END;
$$;

-- Update grant_subscription_credits to also update last_credits_granted_at
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
    -- Try with lowercase match
    SELECT credits_per_month, billing_cycle
    INTO v_credits_per_month, v_billing_cycle
    FROM subscription_plans
    WHERE lower(name) = lower(p_plan_name) AND is_active = true;
  END IF;

  IF v_credits_per_month IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'plan_not_found',
      'plan_name', p_plan_name
    );
  END IF;

  -- Set expiry (always 1 month for subscription credits)
  v_expiry := now() + interval '1 month';

  -- Grant credits
  INSERT INTO usage_credits (user_id, amount, source, description_ar, expires_at)
  VALUES (
    p_user_id, 
    v_credits_per_month, 
    'subscription',
    'نقاط اشتراك ' || p_plan_name,
    v_expiry
  );

  -- Update last_credits_granted_at
  UPDATE user_subscriptions
  SET last_credits_granted_at = now(),
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'credits_granted', v_credits_per_month,
    'expires_at', v_expiry
  );
END;
$$;