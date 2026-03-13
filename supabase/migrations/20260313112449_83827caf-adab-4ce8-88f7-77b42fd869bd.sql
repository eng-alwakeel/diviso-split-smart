-- Drop BOTH overloaded versions
DROP FUNCTION IF EXISTS public.complete_onboarding_task(UUID, TEXT);
DROP FUNCTION IF EXISTS public.complete_onboarding_task(TEXT, UUID);

-- Recreate single unified function
CREATE OR REPLACE FUNCTION public.complete_onboarding_task(p_user_id UUID, p_task_name TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_col TEXT;
  v_tasks_completed INT;
  v_all_completed BOOLEAN;
BEGIN
  CASE p_task_name
    WHEN 'profile'     THEN v_col := 'profile_completed';
    WHEN 'group'       THEN v_col := 'first_group_created';
    WHEN 'expense'     THEN v_col := 'first_expense_added';
    WHEN 'invite'      THEN v_col := 'first_invite_sent';
    WHEN 'referral'    THEN v_col := 'first_referral_made';
    WHEN 'install_app' THEN v_col := 'app_installed';
    WHEN 'close_group' THEN v_col := 'first_group_closed';
    WHEN 'dice'        THEN v_col := 'first_dice_used';
    WHEN 'plan'        THEN v_col := 'first_plan_created';
    ELSE
      RETURN json_build_object('success', false, 'error', 'invalid_task');
  END CASE;

  INSERT INTO onboarding_tasks (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  EXECUTE format('UPDATE onboarding_tasks SET %I = true WHERE user_id = $1', v_col)
  USING p_user_id;

  SELECT
    (CASE WHEN profile_completed    THEN 1 ELSE 0 END) +
    (CASE WHEN first_group_created  THEN 1 ELSE 0 END) +
    (CASE WHEN first_expense_added  THEN 1 ELSE 0 END) +
    (CASE WHEN first_invite_sent    THEN 1 ELSE 0 END) +
    (CASE WHEN first_referral_made  THEN 1 ELSE 0 END) +
    (CASE WHEN app_installed        THEN 1 ELSE 0 END) +
    (CASE WHEN first_group_closed   THEN 1 ELSE 0 END) +
    (CASE WHEN first_dice_used      THEN 1 ELSE 0 END) +
    (CASE WHEN first_plan_created   THEN 1 ELSE 0 END)
  INTO v_tasks_completed
  FROM onboarding_tasks
  WHERE user_id = p_user_id;

  v_all_completed := (v_tasks_completed = 9);

  UPDATE onboarding_tasks
  SET tasks_completed = v_tasks_completed
  WHERE user_id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'task', p_task_name,
    'tasks_completed', v_tasks_completed,
    'all_completed', v_all_completed
  );
END;
$$;