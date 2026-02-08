
-- =============================================
-- Daily Engagement System - Batch 1
-- Tables: daily_hub_cache, group_activity_feed, user_action_log
-- RPCs: compute_daily_hub, log_user_action
-- Triggers: on expenses, settlements, group_members
-- =============================================

-- 1) daily_hub_cache
CREATE TABLE public.daily_hub_cache (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_state text NOT NULL DEFAULT 'new' CHECK (user_state IN ('active', 'low_activity', 'new')),
  streak_count int DEFAULT 0,
  last_action_at timestamptz NULL,
  days_since_last_action int DEFAULT 0,
  last_group_event jsonb NULL,
  suggested_dice_type text NULL,
  motivational_message text NULL,
  computed_at timestamptz DEFAULT now()
);

ALTER TABLE public.daily_hub_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hub cache"
  ON public.daily_hub_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own hub cache"
  ON public.daily_hub_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hub cache"
  ON public.daily_hub_cache FOR UPDATE
  USING (auth.uid() = user_id);

-- 2) group_activity_feed
CREATE TABLE public.group_activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_user_id uuid NOT NULL,
  event_data jsonb DEFAULT '{}',
  smart_message_ar text NULL,
  smart_message_en text NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX group_activity_feed_group_idx ON public.group_activity_feed (group_id, created_at DESC);

ALTER TABLE public.group_activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view activity feed"
  ON public.group_activity_feed FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_activity_feed.group_id
      AND gm.user_id = auth.uid()
  ));

-- 3) user_action_log
CREATE TABLE public.user_action_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_date date NOT NULL DEFAULT CURRENT_DATE,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, action_type, action_date)
);

CREATE INDEX user_action_log_user_date_idx ON public.user_action_log (user_id, action_date);

ALTER TABLE public.user_action_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own action log"
  ON public.user_action_log FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- RPC: compute_daily_hub
-- =============================================
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

  -- 7. Suggested dice type
  v_hour := EXTRACT(HOUR FROM now())::int;
  v_dow := EXTRACT(DOW FROM now())::int;

  SELECT EXISTS(
    SELECT 1 FROM group_members gm2
    JOIN groups g2 ON g2.id = gm2.group_id AND g2.status != 'closed'
    WHERE gm2.user_id = p_user_id
  ) INTO v_has_active_group;

  IF v_hour >= 18 THEN
    v_suggested_dice := 'food';
  ELSIF v_dow IN (5, 6) THEN
    v_suggested_dice := 'activity';
  ELSIF v_has_active_group THEN
    v_suggested_dice := 'activity';
  ELSE
    v_suggested_dice := 'quick';
  END IF;

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
    motivational_message, computed_at
  ) VALUES (
    p_user_id, v_user_state, v_streak, v_last_action_at,
    LEAST(v_days_since, 999), v_last_event, v_suggested_dice,
    v_message, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    user_state = EXCLUDED.user_state,
    streak_count = EXCLUDED.streak_count,
    last_action_at = EXCLUDED.last_action_at,
    days_since_last_action = EXCLUDED.days_since_last_action,
    last_group_event = EXCLUDED.last_group_event,
    suggested_dice_type = EXCLUDED.suggested_dice_type,
    motivational_message = EXCLUDED.motivational_message,
    computed_at = EXCLUDED.computed_at;

  RETURN jsonb_build_object(
    'user_state', v_user_state,
    'streak_count', v_streak,
    'last_action_at', v_last_action_at,
    'days_since_last_action', LEAST(v_days_since, 999),
    'last_group_event', v_last_event,
    'suggested_dice_type', v_suggested_dice,
    'motivational_message', v_message
  );
END;
$$;

-- =============================================
-- RPC: log_user_action
-- =============================================
CREATE OR REPLACE FUNCTION public.log_user_action(
  p_user_id uuid,
  p_action_type text,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_action_log (user_id, action_type, action_date, metadata)
  VALUES (p_user_id, p_action_type, CURRENT_DATE, p_metadata)
  ON CONFLICT (user_id, action_type, action_date) DO NOTHING;

  -- Update last_action_at in daily_hub_cache if exists
  UPDATE daily_hub_cache
  SET last_action_at = now(), days_since_last_action = 0
  WHERE user_id = p_user_id;
END;
$$;

-- =============================================
-- Trigger function: log expense events
-- =============================================
CREATE OR REPLACE FUNCTION public.trg_log_expense_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name text;
  v_msg_ar text;
  v_msg_en text;
BEGIN
  -- Get actor name
  SELECT COALESCE(display_name, name, 'مستخدم') INTO v_actor_name
  FROM profiles WHERE id = NEW.created_by;

  v_msg_ar := v_actor_name || ' أضاف مصروف ' || NEW.amount || ' ' || COALESCE(NEW.currency, 'SAR');
  v_msg_en := v_actor_name || ' added expense ' || NEW.amount || ' ' || COALESCE(NEW.currency, 'SAR');

  -- Insert activity feed event
  INSERT INTO group_activity_feed (group_id, event_type, actor_user_id, event_data, smart_message_ar, smart_message_en)
  VALUES (
    NEW.group_id,
    'expense_added',
    NEW.created_by,
    jsonb_build_object('amount', NEW.amount, 'description', NEW.description, 'currency', COALESCE(NEW.currency, 'SAR')),
    v_msg_ar,
    v_msg_en
  );

  -- Log user action for streak
  PERFORM log_user_action(NEW.created_by, 'expense_added', jsonb_build_object('expense_id', NEW.id));

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_expense_activity_feed
  AFTER INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_log_expense_event();

-- =============================================
-- Trigger function: log settlement events
-- =============================================
CREATE OR REPLACE FUNCTION public.trg_log_settlement_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name text;
  v_msg_ar text;
  v_msg_en text;
BEGIN
  -- Get actor name
  SELECT COALESCE(display_name, name, 'مستخدم') INTO v_actor_name
  FROM profiles WHERE id = NEW.created_by;

  v_msg_ar := v_actor_name || ' سدّد ' || NEW.amount || ' SAR';
  v_msg_en := v_actor_name || ' settled ' || NEW.amount || ' SAR';

  -- Insert activity feed event
  INSERT INTO group_activity_feed (group_id, event_type, actor_user_id, event_data, smart_message_ar, smart_message_en)
  VALUES (
    NEW.group_id,
    'settlement_made',
    NEW.created_by,
    jsonb_build_object('amount', NEW.amount, 'from_user_id', NEW.from_user_id, 'to_user_id', NEW.to_user_id),
    v_msg_ar,
    v_msg_en
  );

  -- Log user action for streak
  PERFORM log_user_action(NEW.created_by, 'settlement_made', jsonb_build_object('settlement_id', NEW.id));

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_settlement_activity_feed
  AFTER INSERT ON public.settlements
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_log_settlement_event();

-- =============================================
-- Trigger function: log member joined events
-- =============================================
CREATE OR REPLACE FUNCTION public.trg_log_member_joined_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_name text;
  v_msg_ar text;
  v_msg_en text;
BEGIN
  SELECT COALESCE(display_name, name, 'عضو جديد') INTO v_member_name
  FROM profiles WHERE id = NEW.user_id;

  v_msg_ar := v_member_name || ' انضم للمجموعة 🎉';
  v_msg_en := v_member_name || ' joined the group 🎉';

  INSERT INTO group_activity_feed (group_id, event_type, actor_user_id, event_data, smart_message_ar, smart_message_en)
  VALUES (
    NEW.group_id,
    'member_joined',
    NEW.user_id,
    jsonb_build_object('member_name', v_member_name, 'role', NEW.role),
    v_msg_ar,
    v_msg_en
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_member_joined_activity_feed
  AFTER INSERT ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_log_member_joined_event();
