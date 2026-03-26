CREATE OR REPLACE FUNCTION public.convert_plan_to_group(p_plan_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_plan record;
  v_group_id uuid;
  v_member record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_plan FROM plans WHERE id = p_plan_id AND owner_user_id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found or not owner';
  END IF;

  IF v_plan.group_id IS NOT NULL THEN
    RAISE EXCEPTION 'Plan already linked to a group';
  END IF;

  INSERT INTO groups (name, currency, owner_id, group_type, source_plan_id)
  VALUES (
    v_plan.title,
    COALESCE(v_plan.budget_currency, 'SAR'),
    v_user_id,
    CASE v_plan.plan_type
      WHEN 'trip' THEN 'trip'
      WHEN 'shared_housing' THEN 'home'
      WHEN 'outing' THEN 'party'
      WHEN 'activity' THEN 'general'
      ELSE 'general'
    END,
    p_plan_id
  )
  RETURNING id INTO v_group_id;

  FOR v_member IN SELECT user_id, role FROM plan_members WHERE plan_id = p_plan_id
  LOOP
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (
      v_group_id,
      v_member.user_id,
      CASE WHEN v_member.role = 'owner' THEN 'owner' ELSE 'member' END
    )
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END LOOP;

  UPDATE plans SET group_id = v_group_id, status = 'done' WHERE id = p_plan_id;

  RETURN v_group_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'convert_plan_to_group error: % % (plan_id=%, user_id=%)', SQLERRM, SQLSTATE, p_plan_id, v_user_id;
    RAISE;
END;
$$;