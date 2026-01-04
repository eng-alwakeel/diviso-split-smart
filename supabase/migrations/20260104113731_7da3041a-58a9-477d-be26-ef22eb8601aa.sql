-- Fix process_daily_checkin to add credits to usage_credits table
CREATE OR REPLACE FUNCTION public.process_daily_checkin(
  p_user_id uuid,
  p_reward_type text,
  p_reward_value jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := current_date;
  v_yesterday date := current_date - interval '1 day';
  v_current_streak integer;
  v_new_streak integer;
  v_longest_streak integer;
  v_total_checkins integer;
  v_coins_to_add integer := 5; -- Always 5 coins per day
  v_existing_checkin uuid;
BEGIN
  -- Check if already checked in today
  SELECT id INTO v_existing_checkin
  FROM daily_checkins
  WHERE user_id = p_user_id AND check_in_date = v_today;
  
  IF v_existing_checkin IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'already_checked_in');
  END IF;
  
  -- Get current streak info
  SELECT current_streak, longest_streak, total_check_ins
  INTO v_current_streak, v_longest_streak, v_total_checkins
  FROM user_streaks
  WHERE user_id = p_user_id;
  
  -- If no streak record, initialize
  IF v_current_streak IS NULL THEN
    v_current_streak := 0;
    v_longest_streak := 0;
    v_total_checkins := 0;
  END IF;
  
  -- Check if streak continues (checked in yesterday) or resets
  IF EXISTS (
    SELECT 1 FROM daily_checkins 
    WHERE user_id = p_user_id AND check_in_date = v_yesterday
  ) THEN
    v_new_streak := v_current_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;
  
  -- Update longest streak if needed
  IF v_new_streak > v_longest_streak THEN
    v_longest_streak := v_new_streak;
  END IF;
  
  -- Insert daily checkin record
  INSERT INTO daily_checkins (user_id, check_in_date, reward_type, reward_value)
  VALUES (p_user_id, v_today, p_reward_type, p_reward_value);
  
  -- Upsert user_streaks
  INSERT INTO user_streaks (user_id, current_streak, longest_streak, total_check_ins, coins, last_check_in, points)
  VALUES (p_user_id, v_new_streak, v_longest_streak, v_total_checkins + 1, v_coins_to_add, v_today, v_coins_to_add)
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = v_new_streak,
    longest_streak = v_longest_streak,
    total_check_ins = user_streaks.total_check_ins + 1,
    coins = COALESCE(user_streaks.coins, 0) + v_coins_to_add,
    points = COALESCE(user_streaks.points, 0) + v_coins_to_add,
    last_check_in = v_today,
    updated_at = now();
  
  -- Add credits to usage_credits table (valid for 1 day - no stacking)
  INSERT INTO usage_credits (user_id, amount, source, description_ar, expires_at)
  VALUES (p_user_id, v_coins_to_add, 'daily_checkin', 'مكافأة تسجيل الدخول اليومي', v_today + interval '1 day');
  
  RETURN jsonb_build_object(
    'success', true,
    'new_streak', v_new_streak,
    'longest_streak', v_longest_streak,
    'points_earned', v_coins_to_add,
    'total_checkins', v_total_checkins + 1
  );
END;
$$;

-- Fix old welcome credits to expire after 7 days instead of 30
UPDATE usage_credits 
SET expires_at = created_at + interval '7 days'
WHERE source = 'welcome' 
  AND expires_at > created_at + interval '7 days';