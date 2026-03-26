
-- Add source_plan_id to groups for reverse linking
ALTER TABLE groups ADD COLUMN IF NOT EXISTS source_plan_id uuid REFERENCES plans(id);

-- Add activity_id to expenses for linking expenses to plan activities
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS activity_id uuid REFERENCES plan_day_activities(id);

-- Update convert_plan_to_group to set source_plan_id and plan status
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

  -- Create group with source_plan_id and plan_type mapped
  INSERT INTO groups (name, currency, owner_id, group_type, source_plan_id)
  VALUES (
    v_plan.title,
    v_plan.budget_currency,
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

  -- Add all plan members to the group
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

  -- Link plan to group and mark as done
  UPDATE plans SET group_id = v_group_id, status = 'done' WHERE id = p_plan_id;

  RETURN v_group_id;
END;
$$;
