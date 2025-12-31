-- إعادة تعيين سلاسل الحضور (user_streaks)
UPDATE user_streaks SET
  current_streak = 0,
  longest_streak = 0,
  total_check_ins = 0,
  points = 0,
  coins = 0,
  total_coins_earned = 0,
  total_coins_spent = 0,
  last_check_in = NULL,
  updated_at = NOW();

-- حذف سجلات الدخول اليومي
DELETE FROM daily_checkins;

-- إعادة تعيين مهام الإعداد (onboarding)
UPDATE onboarding_tasks SET
  profile_completed = false,
  first_group_created = false,
  first_expense_added = false,
  first_invite_sent = false,
  first_referral_made = false,
  tasks_completed = 0,
  reward_claimed = false,
  reward_claimed_at = NULL,
  updated_at = NOW();

-- حذف النقاط المكتسبة
DELETE FROM usage_credits;

-- حذف سجل العملات
DELETE FROM coin_transactions;