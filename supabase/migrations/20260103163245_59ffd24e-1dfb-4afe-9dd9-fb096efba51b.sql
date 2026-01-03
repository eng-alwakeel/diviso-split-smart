-- Fix process_daily_checkin to properly add coins
CREATE OR REPLACE FUNCTION public.process_daily_checkin(
  p_user_id UUID,
  p_reward_type TEXT,
  p_reward_value JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_checkin DATE;
  v_current_streak INTEGER;
  v_new_streak INTEGER;
  v_points_earned INTEGER;
  v_coins_earned INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- التحقق من عدم تسجيل الدخول اليوم
  IF EXISTS (SELECT 1 FROM daily_checkins WHERE user_id = p_user_id AND check_in_date = v_today) THEN
    RETURN jsonb_build_object('success', false, 'message', 'already_checked_in');
  END IF;

  -- جلب بيانات الـ streak الحالية
  SELECT last_check_in, current_streak INTO v_last_checkin, v_current_streak
  FROM user_streaks WHERE user_id = p_user_id;

  -- حساب الـ streak الجديد
  IF v_last_checkin IS NULL THEN
    v_new_streak := 1;
  ELSIF v_last_checkin = v_today - INTERVAL '1 day' THEN
    v_new_streak := COALESCE(v_current_streak, 0) + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  -- استخراج العملات من p_reward_value
  v_coins_earned := COALESCE((p_reward_value->>'coins')::INTEGER, 0);

  -- حساب النقاط بناءً على اليوم في الأسبوع
  v_points_earned := CASE ((v_new_streak - 1) % 7) + 1
    WHEN 1 THEN 5
    WHEN 2 THEN 5
    WHEN 3 THEN 10
    WHEN 4 THEN 10
    WHEN 5 THEN 15
    WHEN 6 THEN 15
    WHEN 7 THEN 25
    ELSE 5
  END;

  -- إضافة سجل الدخول
  INSERT INTO daily_checkins (user_id, check_in_date, reward_type, reward_value)
  VALUES (p_user_id, v_today, p_reward_type, p_reward_value);

  -- تحديث أو إنشاء سجل الـ streak مع إضافة العملات
  INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_check_in, total_check_ins, points, coins, total_coins_earned)
  VALUES (p_user_id, v_new_streak, v_new_streak, v_today, 1, v_points_earned, v_coins_earned, v_coins_earned)
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = v_new_streak,
    longest_streak = GREATEST(user_streaks.longest_streak, v_new_streak),
    last_check_in = v_today,
    total_check_ins = user_streaks.total_check_ins + 1,
    points = user_streaks.points + v_points_earned,
    coins = user_streaks.coins + v_coins_earned,
    total_coins_earned = user_streaks.total_coins_earned + v_coins_earned,
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'new_streak', v_new_streak,
    'points_earned', v_points_earned,
    'coins_earned', v_coins_earned,
    'reward_type', p_reward_type
  );
END;
$$;