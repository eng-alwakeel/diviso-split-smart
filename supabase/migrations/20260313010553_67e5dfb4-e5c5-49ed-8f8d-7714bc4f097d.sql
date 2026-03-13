-- Add new onboarding columns
ALTER TABLE public.onboarding_tasks 
  ADD COLUMN IF NOT EXISTS app_installed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_group_closed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_dice_used BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_plan_created BOOLEAN DEFAULT false;

-- Update the complete_onboarding_task function to support new tasks
CREATE OR REPLACE FUNCTION public.complete_onboarding_task(p_task_name TEXT, p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_column TEXT;
  v_result JSON;
BEGIN
  -- Map task name to column
  CASE p_task_name
    WHEN 'install_app' THEN v_column := 'app_installed';
    WHEN 'profile' THEN v_column := 'profile_completed';
    WHEN 'group' THEN v_column := 'first_group_created';
    WHEN 'invite' THEN v_column := 'first_invite_sent';
    WHEN 'expense' THEN v_column := 'first_expense_added';
    WHEN 'close_group' THEN v_column := 'first_group_closed';
    WHEN 'dice' THEN v_column := 'first_dice_used';
    WHEN 'plan' THEN v_column := 'first_plan_created';
    WHEN 'referral' THEN v_column := 'first_referral_made';
    ELSE
      RETURN json_build_object('success', false, 'error', 'Invalid task name: ' || p_task_name);
  END CASE;

  -- Ensure row exists
  INSERT INTO onboarding_tasks (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update the specific column
  EXECUTE format(
    'UPDATE onboarding_tasks SET %I = true, tasks_completed = (
      SELECT COUNT(*) FILTER (WHERE val) FROM (
        VALUES (profile_completed), (first_group_created), (first_expense_added),
               (first_invite_sent), (first_referral_made), (app_installed),
               (first_group_closed), (first_dice_used), (first_plan_created)
      ) AS t(val)
    ) WHERE user_id = $1 AND %I = false',
    v_column, v_column
  ) USING p_user_id;

  SELECT json_build_object('success', true, 'task', p_task_name) INTO v_result;
  RETURN v_result;
END;
$$;