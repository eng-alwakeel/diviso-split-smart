-- Fix admin_manage_credits to use correct column names (amount/consumed instead of credits_remaining)
CREATE OR REPLACE FUNCTION public.admin_manage_credits(
  p_user_id uuid,
  p_amount integer,
  p_operation text,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_credit_id uuid;
BEGIN
  -- Check admin permission
  IF NOT is_admin_level_user(v_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Validate operation
  IF p_operation NOT IN ('grant', 'deduct') THEN
    RAISE EXCEPTION 'Invalid operation: must be grant or deduct';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- For grant: insert new credits with amount (correct column)
  IF p_operation = 'grant' THEN
    INSERT INTO usage_credits (user_id, amount, consumed, source, expires_at)
    VALUES (p_user_id, p_amount, 0, 'admin_grant', now() + interval '1 year')
    RETURNING id INTO v_credit_id;
  END IF;

  -- For deduct: increase consumed on existing credits
  IF p_operation = 'deduct' THEN
    UPDATE usage_credits
    SET consumed = LEAST(amount, consumed + p_amount)
    WHERE user_id = p_user_id
      AND expires_at > now()
      AND amount > consumed
    RETURNING id INTO v_credit_id;
  END IF;

  -- Log the action in admin audit
  INSERT INTO admin_audit_log (admin_id, target_user_id, action, details)
  VALUES (v_admin_id, p_user_id, p_operation || '_credits', jsonb_build_object(
    'amount', p_amount,
    'reason', p_reason
  ));

  -- Log in credit consumption (only if credit_id exists)
  IF v_credit_id IS NOT NULL THEN
    INSERT INTO credit_consumption_log (user_id, credit_id, action_type, amount_consumed, metadata)
    VALUES (p_user_id, v_credit_id, 'admin_' || p_operation, p_amount, jsonb_build_object(
      'admin_id', v_admin_id,
      'reason', p_reason
    ));
  END IF;

  RETURN jsonb_build_object('success', true, 'credit_id', v_credit_id);
END;
$$;