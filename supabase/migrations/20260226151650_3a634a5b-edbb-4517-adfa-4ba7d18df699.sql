
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
      dhc.last_daily_notification_at,
      COALESCE(us.language, 'ar') as lang
    FROM daily_hub_cache dhc
    JOIN user_settings us ON us.user_id = dhc.user_id
    JOIN profiles p ON p.id = dhc.user_id
    WHERE
      -- push_notifications enabled
      us.push_notifications = true
      -- not active in last 12 hours
      AND (p.last_active_at IS NULL
           OR p.last_active_at < now() - interval '12 hours')
      -- skip new users
      AND dhc.user_state != 'new'
      -- SKIP dormant users (inactive 30+ days)
      AND (dhc.days_since_last_action IS NULL OR dhc.days_since_last_action < 30)
      -- FREQUENCY CONTROL:
      -- active users: daily (not notified today)
      -- low_activity users: every 3 days
      AND (
        dhc.last_daily_notification_at IS NULL
        OR (
          dhc.user_state = 'active'
          AND dhc.last_daily_notification_at::date < CURRENT_DATE
        )
        OR (
          dhc.user_state = 'low_activity'
          AND dhc.last_daily_notification_at < now() - interval '3 days'
        )
      )
  LOOP
    v_idx := 1 + floor(random() * 3)::int;

    IF v_user_record.user_state = 'active' THEN
      v_message_ar := v_active_messages_ar[v_idx];
      v_message_en := v_active_messages_en[v_idx];
      v_message_ar := replace(v_message_ar, '%s', v_user_record.streak_count::text);
      v_message_en := replace(v_message_en, '%s', v_user_record.streak_count::text);
    ELSIF v_user_record.user_state = 'low_activity' THEN
      v_message_ar := v_low_messages_ar[v_idx];
      v_message_en := v_low_messages_en[v_idx];
      v_message_ar := replace(v_message_ar, '%s', v_user_record.days_since_last_action::text);
      v_message_en := replace(v_message_en, '%s', v_user_record.days_since_last_action::text);
    ELSE
      CONTINUE;
    END IF;

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

    UPDATE daily_hub_cache
    SET last_daily_notification_at = now()
    WHERE user_id = v_user_record.user_id;

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('notifications_sent', v_count);
END;
$$;
