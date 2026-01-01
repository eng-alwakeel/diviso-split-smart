-- Create function to complete credit purchase
CREATE OR REPLACE FUNCTION public.complete_credit_purchase(
  p_purchase_id uuid,
  p_payment_reference text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase RECORD;
  v_package RECORD;
BEGIN
  -- Get purchase record
  SELECT * INTO v_purchase 
  FROM credit_purchases 
  WHERE id = p_purchase_id AND status = 'pending';
  
  IF v_purchase IS NULL THEN
    RAISE NOTICE 'Purchase not found or already completed: %', p_purchase_id;
    RETURN false;
  END IF;
  
  -- Get package details for validity days
  SELECT * INTO v_package
  FROM credit_packages
  WHERE id = v_purchase.package_id;
  
  -- Update purchase status
  UPDATE credit_purchases 
  SET status = 'completed', 
      payment_reference = p_payment_reference
  WHERE id = p_purchase_id;
  
  -- Add credits to usage_credits (use package validity or default 90 days)
  INSERT INTO usage_credits (user_id, amount, source, expires_at)
  VALUES (
    v_purchase.user_id, 
    v_purchase.credits_purchased, 
    'purchase',
    now() + (COALESCE(v_package.validity_days, 90) || ' days')::interval
  );
  
  RETURN true;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.complete_credit_purchase(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_credit_purchase(uuid, text) TO service_role;