
-- RPC: link_expense_to_plan
CREATE OR REPLACE FUNCTION public.link_expense_to_plan(
  p_expense_id uuid,
  p_plan_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_expense_group_id uuid;
  v_plan_group_id uuid;
BEGIN
  -- Check user is creator or payer of the expense
  IF NOT EXISTS (
    SELECT 1 FROM expenses
    WHERE id = p_expense_id
    AND (created_by = v_user_id OR payer_id = v_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized to modify this expense';
  END IF;

  -- Check user can access the plan
  IF NOT public.can_access_plan(v_user_id, p_plan_id) THEN
    RAISE EXCEPTION 'Not authorized to access this plan';
  END IF;

  -- Get expense group_id and plan group_id
  SELECT group_id INTO v_expense_group_id FROM expenses WHERE id = p_expense_id;
  SELECT group_id INTO v_plan_group_id FROM plans WHERE id = p_plan_id;

  -- If plan has a group, expense must belong to the same group
  IF v_plan_group_id IS NOT NULL AND v_expense_group_id != v_plan_group_id THEN
    RAISE EXCEPTION 'Expense must belong to the same group as the plan';
  END IF;

  -- Update the expense
  UPDATE expenses SET plan_id = p_plan_id, updated_at = now() WHERE id = p_expense_id;

  RETURN true;
END;
$$;

-- RPC: unlink_expense_from_plan
CREATE OR REPLACE FUNCTION public.unlink_expense_from_plan(
  p_expense_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_plan_id uuid;
BEGIN
  -- Get the plan_id from the expense
  SELECT plan_id INTO v_plan_id FROM expenses WHERE id = p_expense_id;

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Expense is not linked to any plan';
  END IF;

  -- Check user is creator of the expense OR admin of the plan
  IF NOT EXISTS (
    SELECT 1 FROM expenses WHERE id = p_expense_id AND created_by = v_user_id
  ) AND NOT public.is_plan_admin(v_user_id, v_plan_id) THEN
    RAISE EXCEPTION 'Not authorized to unlink this expense';
  END IF;

  -- Update the expense
  UPDATE expenses SET plan_id = NULL, updated_at = now() WHERE id = p_expense_id;

  RETURN true;
END;
$$;
