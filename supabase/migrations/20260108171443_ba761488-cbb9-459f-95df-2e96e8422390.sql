-- Update join_group_with_token to create referral_progress for group invites
CREATE OR REPLACE FUNCTION public.join_group_with_token(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_record RECORD;
  v_user_id uuid;
  v_existing_member uuid;
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

  -- Check if already a member
  SELECT id INTO v_existing_member
  FROM public.group_members
  WHERE group_id = v_token_record.group_id
    AND user_id = v_user_id;

  IF v_existing_member IS NOT NULL THEN
    RETURN v_token_record.group_id;
  END IF;

  -- Add user to the group
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_token_record.group_id, v_user_id, v_token_record.role);

  -- Update token usage
  UPDATE public.group_join_tokens
  SET current_uses = COALESCE(current_uses, 0) + 1,
      used_at = now(),
      used_by = v_user_id
  WHERE id = v_token_record.id;

  -- ========================================
  -- Create referral_progress for group invites
  -- ========================================
  
  -- Get the group owner (inviter)
  SELECT owner_id INTO v_group_owner_id
  FROM public.groups
  WHERE id = v_token_record.group_id;

  -- Only create referral tracking if inviter is different from invitee
  IF v_group_owner_id IS NOT NULL AND v_group_owner_id != v_user_id THEN
    -- Create referral record for this group invite
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

    -- Create referral_progress for milestone tracking
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