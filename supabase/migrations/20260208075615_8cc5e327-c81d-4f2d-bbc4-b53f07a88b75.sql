
-- =============================================
-- Batch 2: Locked Dice + Smart Notifications + Cron
-- =============================================

-- A) Add new columns to daily_hub_cache
ALTER TABLE public.daily_hub_cache
  ADD COLUMN IF NOT EXISTS dice_of_the_day text NULL,
  ADD COLUMN IF NOT EXISTS dice_locked_at date NULL,
  ADD COLUMN IF NOT EXISTS last_daily_notification_at timestamptz NULL;

-- B) Update compute_daily_hub to support dice locking
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
  -- Check if dice is already locked for today
  SELECT dice_of_the_day, dice_locked_at
  INTO v_dice_of_day, v_dice_locked_at
  FROM daily_hub_cache
  WHERE user_id = p_user_id;

  IF v_dice_locked_at IS NOT NULL AND v_dice_locked_at = CURRENT_DATE AND v_dice_of_day IS NOT NULL THEN
    -- Dice already locked for today, keep it
    NULL;
  ELSE
    -- Compute new dice
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

-- C) compute_all_daily_hubs - batch compute for all active users
CREATE OR REPLACE FUNCTION public.compute_all_daily_hubs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_record RECORD;
  v_count int := 0;
  v_result jsonb;
BEGIN
  FOR v_user_record IN
    SELECT p.id
    FROM profiles p
    WHERE p.last_active_at > now() - interval '30 days'
       OR EXISTS (SELECT 1 FROM daily_hub_cache dhc WHERE dhc.user_id = p.id)
  LOOP
    PERFORM compute_daily_hub(v_user_record.id);
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('users_computed', v_count);
END;
$$;

-- D) send_daily_engagement_notifications - segmented daily notifications
CREATE OR REPLACE FUNCTION public.send_daily_engagement_notifications()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_record RECORD;
  v_count int := 0;
  v_message_ar text;
  v_message_en text;
  v_notif_type text := 'daily_engagement';
  v_active_messages_ar text[] := ARRAY[
    '🔥 سلسلتك %s يوم! لا تكسرها',
    'مصاريفك منظمة هالأسبوع 👌',
    'ارمِ نرد اليوم واكتشف وش ينتظرك 🎲'
  ];
  v_active_messages_en text[] := ARRAY[
    '🔥 %s day streak! Don''t break it',
    'Your expenses are well organized this week 👌',
    'Roll today''s dice and discover what awaits 🎲'
  ];
  v_low_messages_ar text[] := ARRAY[
    'مجموعتك قربت تكتمل اليوم 👀',
    'صار لك %s يوم ما تحركت 👀',
    'خطوة وحدة بسيطة تفرق! 💪'
  ];
  v_low_messages_en text[] := ARRAY[
    'Your group is almost balanced today 👀',
    'It''s been %s days since your last action 👀',
    'One simple step makes a difference! 💪'
  ];
  v_idx int;
BEGIN
  FOR v_user_record IN
    SELECT
      dhc.user_id,
      dhc.user_state,
      dhc.streak_count,
      dhc.days_since_last_action,
      COALESCE(us.language, 'ar') as lang
    FROM daily_hub_cache dhc
    JOIN user_settings us ON us.user_id = dhc.user_id
    JOIN profiles p ON p.id = dhc.user_id
    WHERE
      -- push_notifications enabled
      us.push_notifications = true
      -- not already notified today
      AND (dhc.last_daily_notification_at IS NULL
           OR dhc.last_daily_notification_at::date < CURRENT_DATE)
      -- not active in last 12 hours
      AND (p.last_active_at IS NULL
           OR p.last_active_at < now() - interval '12 hours')
      -- skip new users
      AND dhc.user_state != 'new'
  LOOP
    v_idx := 1 + floor(random() * 3)::int;

    IF v_user_record.user_state = 'active' THEN
      v_message_ar := v_active_messages_ar[v_idx];
      v_message_en := v_active_messages_en[v_idx];
      -- Replace streak placeholder
      v_message_ar := replace(v_message_ar, '%s', v_user_record.streak_count::text);
      v_message_en := replace(v_message_en, '%s', v_user_record.streak_count::text);
    ELSIF v_user_record.user_state = 'low_activity' THEN
      v_message_ar := v_low_messages_ar[v_idx];
      v_message_en := v_low_messages_en[v_idx];
      -- Replace days placeholder
      v_message_ar := replace(v_message_ar, '%s', v_user_record.days_since_last_action::text);
      v_message_en := replace(v_message_en, '%s', v_user_record.days_since_last_action::text);
    ELSE
      CONTINUE;
    END IF;

    -- Insert notification
    INSERT INTO notifications (user_id, type, payload, created_at, updated_at)
    VALUES (
      v_user_record.user_id,
      v_notif_type,
      jsonb_build_object(
        'message_ar', v_message_ar,
        'message_en', v_message_en,
        'user_state', v_user_record.user_state,
        'streak_count', v_user_record.streak_count,
        'days_inactive', v_user_record.days_since_last_action
      ),
      now(),
      now()
    );

    -- Update last notification timestamp
    UPDATE daily_hub_cache
    SET last_daily_notification_at = now()
    WHERE user_id = v_user_record.user_id;

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('notifications_sent', v_count);
END;
$$;
