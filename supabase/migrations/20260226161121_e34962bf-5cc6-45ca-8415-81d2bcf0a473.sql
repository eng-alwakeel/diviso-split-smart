
-- 1. Fix compute_daily_hub: fallback to profiles.last_active_at
CREATE OR REPLACE FUNCTION public.compute_daily_hub(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_action_at timestamptz;
  v_days_since int;
  v_groups_count int;
  v_user_state text;
  v_streak int;
  v_last_event jsonb;
  v_suggested_dice text;
  v_dice_of_day text;
  v_dice_locked_at date;
  v_message text;
  v_hour int;
  v_dow int;
  v_has_active_group boolean;
  v_messages_active text[] := ARRAY[
    'أداؤك ممتاز هالأسبوع 💪',
    'استمر، أنت من أنشط المستخدمين!',
    'مصاريفك منظمة، أحسنت 👌'
  ];
  v_messages_low text[] := ARRAY[
    'وش رأيك تضيف مصروف بسيط اليوم؟',
    'مجموعتك تنتظرك 👀',
    'خطوة صغيرة تفرق!'
  ];
BEGIN
  -- 1. Last real action
  SELECT MAX(created_at) INTO v_last_action_at
  FROM user_action_log WHERE user_id = p_user_id;

  -- Fallback: use last_active_at from profiles if no action log entries
  IF v_last_action_at IS NULL THEN
    SELECT last_active_at INTO v_last_action_at
    FROM profiles WHERE id = p_user_id;
  END IF;

  -- 2. Days since
  IF v_last_action_at IS NULL THEN
    v_days_since := 999;
  ELSE
    v_days_since := EXTRACT(DAY FROM (now() - v_last_action_at))::int;
  END IF;

  -- 3. Groups count
  SELECT COUNT(*) INTO v_groups_count
  FROM group_members WHERE user_id = p_user_id;

  -- 4. User state
  IF v_last_action_at IS NULL AND v_groups_count = 0 THEN
    v_user_state := 'new';
  ELSIF v_days_since <= 3 THEN
    v_user_state := 'active';
  ELSIF v_days_since <= 14 THEN
    v_user_state := 'low_activity';
  ELSIF v_groups_count = 0 THEN
    v_user_state := 'new';
  ELSE
    v_user_state := 'low_activity';
  END IF;

  -- 5. Real streak (consecutive days with at least one action)
  WITH daily_actions AS (
    SELECT DISTINCT action_date
    FROM user_action_log
    WHERE user_id = p_user_id
    ORDER BY action_date DESC
  ),
  numbered AS (
    SELECT action_date,
      action_date - (ROW_NUMBER() OVER (ORDER BY action_date DESC))::int AS grp
    FROM daily_actions
  )
  SELECT COUNT(*) INTO v_streak
  FROM numbered
  WHERE grp = (SELECT grp FROM numbered LIMIT 1);

  IF v_streak IS NULL THEN v_streak := 0; END IF;

  -- 6. Last group event
  SELECT jsonb_build_object(
    'event_type', gaf.event_type,
    'smart_message_ar', gaf.smart_message_ar,
    'smart_message_en', gaf.smart_message_en,
    'group_id', gaf.group_id,
    'group_name', g.name,
    'created_at', gaf.created_at
  ) INTO v_last_event
  FROM group_activity_feed gaf
  JOIN groups g ON g.id = gaf.group_id
  JOIN group_members gm ON gm.group_id = gaf.group_id AND gm.user_id = p_user_id
  ORDER BY gaf.created_at DESC
  LIMIT 1;

  -- 7. Dice of the day (locked per day)
  SELECT dice_of_the_day, dice_locked_at
  INTO v_dice_of_day, v_dice_locked_at
  FROM daily_hub_cache
  WHERE user_id = p_user_id;

  IF v_dice_locked_at IS NOT NULL AND v_dice_locked_at = CURRENT_DATE AND v_dice_of_day IS NOT NULL THEN
    NULL;
  ELSE
    v_hour := EXTRACT(HOUR FROM now())::int;
    v_dow := EXTRACT(DOW FROM now())::int;

    SELECT EXISTS(
      SELECT 1 FROM group_members gm2
      JOIN groups g2 ON g2.id = gm2.group_id AND g2.status != 'closed'
      WHERE gm2.user_id = p_user_id
    ) INTO v_has_active_group;

    IF v_hour >= 18 THEN
      v_dice_of_day := 'food';
    ELSIF v_dow IN (5, 6) THEN
      v_dice_of_day := 'activity';
    ELSIF v_has_active_group THEN
      v_dice_of_day := 'activity';
    ELSE
      v_dice_of_day := 'quick';
    END IF;

    v_dice_locked_at := CURRENT_DATE;
  END IF;

  v_suggested_dice := v_dice_of_day;

  -- 8. Motivational message
  IF v_user_state = 'active' THEN
    v_message := v_messages_active[1 + floor(random() * array_length(v_messages_active, 1))::int];
  ELSIF v_user_state = 'low_activity' THEN
    v_message := v_messages_low[1 + floor(random() * array_length(v_messages_low, 1))::int];
  ELSE
    v_message := NULL;
  END IF;

  -- 9. Upsert cache
  INSERT INTO daily_hub_cache (
    user_id, user_state, streak_count, last_action_at,
    days_since_last_action, last_group_event, suggested_dice_type,
    motivational_message, computed_at, dice_of_the_day, dice_locked_at
  ) VALUES (
    p_user_id, v_user_state, v_streak, v_last_action_at,
    LEAST(v_days_since, 999), v_last_event, v_suggested_dice,
    v_message, now(), v_dice_of_day, v_dice_locked_at
  )
  ON CONFLICT (user_id) DO UPDATE SET
    user_state = EXCLUDED.user_state,
    streak_count = EXCLUDED.streak_count,
    last_action_at = EXCLUDED.last_action_at,
    days_since_last_action = EXCLUDED.days_since_last_action,
    last_group_event = EXCLUDED.last_group_event,
    suggested_dice_type = EXCLUDED.suggested_dice_type,
    motivational_message = EXCLUDED.motivational_message,
    computed_at = EXCLUDED.computed_at,
    dice_of_the_day = EXCLUDED.dice_of_the_day,
    dice_locked_at = EXCLUDED.dice_locked_at;

  RETURN jsonb_build_object(
    'user_state', v_user_state,
    'streak_count', v_streak,
    'last_action_at', v_last_action_at,
    'days_since_last_action', LEAST(v_days_since, 999),
    'last_group_event', v_last_event,
    'suggested_dice_type', v_suggested_dice,
    'motivational_message', v_message,
    'dice_of_the_day', v_dice_of_day,
    'dice_locked_at', v_dice_locked_at
  );
END;
$$;


-- 2. Fix join_group_with_token: add member_joined notifications server-side
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
    AND gm.user_id != v_user_id;

  -- ========================================
  -- Create referral_progress for group invites
  -- ========================================
  
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


-- 3. Archive old incorrect daily_engagement notifications with days_inactive >= 30
UPDATE notifications
SET archived_at = now(), read_at = COALESCE(read_at, now())
WHERE type = 'daily_engagement'
  AND (payload->>'days_inactive')::int >= 30;
