
-- 1. Unique index: prevent duplicate user_id per group (non-archived)
CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_unique_user
ON public.group_members (group_id, user_id)
WHERE user_id IS NOT NULL AND archived_at IS NULL;

-- 2. Unique index: prevent duplicate phone_e164 per group (non-archived)
CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_unique_phone
ON public.group_members (group_id, phone_e164)
WHERE phone_e164 IS NOT NULL AND archived_at IS NULL;

-- 3. Update join_group_with_token to merge pending members
CREATE OR REPLACE FUNCTION public.join_group_with_token(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_record RECORD;
  v_user_id uuid;
  v_user_phone text;
  v_existing_member_id uuid;
  v_pending_member_id uuid;
  v_group_owner_id uuid;
  v_referral_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '22023';
  END IF;

  -- Find the token
  SELECT * INTO v_token_record
  FROM public.group_join_tokens
  WHERE token::text = p_token
    AND expires_at > now()
    AND (max_uses = -1 OR max_uses IS NULL OR current_uses < max_uses);

  IF v_token_record IS NULL THEN
    RAISE EXCEPTION 'invalid_or_expired_token' USING ERRCODE = '22023';
  END IF;

  -- Check if already a member (with user_id set)
  SELECT id INTO v_existing_member_id
  FROM public.group_members
  WHERE group_id = v_token_record.group_id
    AND user_id = v_user_id
    AND archived_at IS NULL;

  IF v_existing_member_id IS NOT NULL THEN
    RETURN v_token_record.group_id;
  END IF;

  -- Get the joining user's phone
  SELECT phone INTO v_user_phone
  FROM public.profiles
  WHERE id = v_user_id;

  -- Check for existing pending member with same phone
  IF v_user_phone IS NOT NULL AND v_user_phone != '' THEN
    SELECT id INTO v_pending_member_id
    FROM public.group_members
    WHERE group_id = v_token_record.group_id
      AND phone_e164 = v_user_phone
      AND user_id IS NULL
      AND archived_at IS NULL
    LIMIT 1;
  END IF;

  IF v_pending_member_id IS NOT NULL THEN
    -- Merge: update pending row to active
    UPDATE public.group_members
    SET user_id = v_user_id,
        status = 'active',
        joined_at = now()
    WHERE id = v_pending_member_id;
  ELSE
    -- Normal insert
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (v_token_record.group_id, v_user_id, v_token_record.role);
  END IF;

  -- Update token usage
  UPDATE public.group_join_tokens
  SET current_uses = COALESCE(current_uses, 0) + 1,
      used_at = now(),
      used_by = v_user_id
  WHERE id = v_token_record.id;

  -- Notify other group members about the new member
  INSERT INTO notifications (user_id, type, payload)
  SELECT
    gm.user_id,
    'member_joined',
    jsonb_build_object(
      'group_name', (SELECT name FROM groups WHERE id = v_token_record.group_id),
      'group_id', v_token_record.group_id::text,
      'member_name', (SELECT COALESCE(display_name, name, 'عضو جديد')
                      FROM profiles WHERE id = v_user_id)
    )
  FROM group_members gm
  WHERE gm.group_id = v_token_record.group_id
    AND gm.user_id != v_user_id
    AND gm.user_id IS NOT NULL;

  -- Create referral_progress for group invites
  SELECT owner_id INTO v_group_owner_id
  FROM public.groups
  WHERE id = v_token_record.group_id;

  IF v_group_owner_id IS NOT NULL AND v_group_owner_id != v_user_id THEN
    INSERT INTO public.referrals (
      inviter_id,
      invitee_phone,
      invitee_name,
      status,
      joined_at,
      reward_days,
      referral_source,
      group_id,
      expires_at
    ) VALUES (
      v_group_owner_id,
      'group_member_' || v_user_id::text,
      (SELECT COALESCE(display_name, name, 'عضو') FROM public.profiles WHERE id = v_user_id),
      'joined',
      now(),
      7,
      'group_invite',
      v_token_record.group_id,
      now() + interval '30 days'
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_referral_id;

    IF v_referral_id IS NOT NULL THEN
      INSERT INTO public.referral_progress (
        referral_id,
        inviter_id,
        invitee_id,
        signup_completed,
        points_for_signup,
        total_points
      ) VALUES (
        v_referral_id,
        v_group_owner_id,
        v_user_id,
        true,
        0,
        0
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN v_token_record.group_id;
END;
$$;

-- 4. Create merge_duplicate_members cleanup function
CREATE OR REPLACE FUNCTION public.merge_duplicate_members(p_group_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merged integer := 0;
  v_pending RECORD;
BEGIN
  -- Find pending members (user_id IS NULL) that have a matching active member (same phone_e164, user_id IS NOT NULL)
  FOR v_pending IN
    SELECT pm.id as pending_id, am.id as active_id
    FROM group_members pm
    JOIN group_members am
      ON am.group_id = pm.group_id
      AND am.phone_e164 = pm.phone_e164
      AND am.user_id IS NOT NULL
      AND am.archived_at IS NULL
    WHERE pm.group_id = p_group_id
      AND pm.user_id IS NULL
      AND pm.archived_at IS NULL
      AND pm.phone_e164 IS NOT NULL
  LOOP
    -- Archive the pending row
    UPDATE group_members
    SET archived_at = now()
    WHERE id = v_pending.pending_id;

    v_merged := v_merged + 1;
  END LOOP;

  RETURN v_merged;
END;
$$;
