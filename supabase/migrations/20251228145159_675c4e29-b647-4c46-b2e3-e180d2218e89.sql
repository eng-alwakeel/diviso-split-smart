-- Create achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_value INTEGER NOT NULL DEFAULT 0,
  achievement_level TEXT,
  shared BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,
  shared_platform TEXT,
  coins_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX idx_achievements_type ON public.achievements(achievement_type);
CREATE INDEX idx_achievements_shared ON public.achievements(shared);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own achievements"
ON public.achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
ON public.achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
ON public.achievements FOR UPDATE
USING (auth.uid() = user_id);

-- Function to check and create achievements
CREATE OR REPLACE FUNCTION public.check_and_create_achievements()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_total_expenses INTEGER;
  v_total_groups INTEGER;
  v_total_savings NUMERIC;
BEGIN
  -- Get user id based on trigger source
  IF TG_TABLE_NAME = 'expenses' THEN
    v_user_id := NEW.created_by;
  ELSIF TG_TABLE_NAME = 'groups' THEN
    v_user_id := NEW.owner_id;
  ELSE
    RETURN NEW;
  END IF;

  -- Check expenses milestone
  IF TG_TABLE_NAME = 'expenses' THEN
    SELECT COUNT(*) INTO v_total_expenses
    FROM public.expenses WHERE created_by = v_user_id;

    -- Check for expense milestones: 10, 50, 100, 500
    IF v_total_expenses = 10 AND NOT EXISTS (
      SELECT 1 FROM public.achievements 
      WHERE user_id = v_user_id AND achievement_type = 'expenses_milestone' AND achievement_value = 10
    ) THEN
      INSERT INTO public.achievements (user_id, achievement_type, achievement_value, achievement_level)
      VALUES (v_user_id, 'expenses_milestone', 10, 'bronze');
    ELSIF v_total_expenses = 50 AND NOT EXISTS (
      SELECT 1 FROM public.achievements 
      WHERE user_id = v_user_id AND achievement_type = 'expenses_milestone' AND achievement_value = 50
    ) THEN
      INSERT INTO public.achievements (user_id, achievement_type, achievement_value, achievement_level)
      VALUES (v_user_id, 'expenses_milestone', 50, 'silver');
    ELSIF v_total_expenses = 100 AND NOT EXISTS (
      SELECT 1 FROM public.achievements 
      WHERE user_id = v_user_id AND achievement_type = 'expenses_milestone' AND achievement_value = 100
    ) THEN
      INSERT INTO public.achievements (user_id, achievement_type, achievement_value, achievement_level)
      VALUES (v_user_id, 'expenses_milestone', 100, 'gold');
    ELSIF v_total_expenses = 500 AND NOT EXISTS (
      SELECT 1 FROM public.achievements 
      WHERE user_id = v_user_id AND achievement_type = 'expenses_milestone' AND achievement_value = 500
    ) THEN
      INSERT INTO public.achievements (user_id, achievement_type, achievement_value, achievement_level)
      VALUES (v_user_id, 'expenses_milestone', 500, 'platinum');
    END IF;
  END IF;

  -- Check groups milestone
  IF TG_TABLE_NAME = 'groups' THEN
    SELECT COUNT(*) INTO v_total_groups
    FROM public.groups WHERE owner_id = v_user_id;

    -- Check for group milestones: 1, 5, 10
    IF v_total_groups = 1 AND NOT EXISTS (
      SELECT 1 FROM public.achievements 
      WHERE user_id = v_user_id AND achievement_type = 'groups_milestone' AND achievement_value = 1
    ) THEN
      INSERT INTO public.achievements (user_id, achievement_type, achievement_value, achievement_level)
      VALUES (v_user_id, 'groups_milestone', 1, 'bronze');
    ELSIF v_total_groups = 5 AND NOT EXISTS (
      SELECT 1 FROM public.achievements 
      WHERE user_id = v_user_id AND achievement_type = 'groups_milestone' AND achievement_value = 5
    ) THEN
      INSERT INTO public.achievements (user_id, achievement_type, achievement_value, achievement_level)
      VALUES (v_user_id, 'groups_milestone', 5, 'silver');
    ELSIF v_total_groups = 10 AND NOT EXISTS (
      SELECT 1 FROM public.achievements 
      WHERE user_id = v_user_id AND achievement_type = 'groups_milestone' AND achievement_value = 10
    ) THEN
      INSERT INTO public.achievements (user_id, achievement_type, achievement_value, achievement_level)
      VALUES (v_user_id, 'groups_milestone', 10, 'gold');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER check_expense_achievements
AFTER INSERT ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.check_and_create_achievements();

CREATE TRIGGER check_group_achievements
AFTER INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.check_and_create_achievements();

-- Function to share achievement and earn coins
CREATE OR REPLACE FUNCTION public.share_achievement(
  p_achievement_id UUID,
  p_platform TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_already_shared BOOLEAN;
  v_coins_to_earn INTEGER := 20;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if already shared
  SELECT shared INTO v_already_shared
  FROM public.achievements
  WHERE id = p_achievement_id AND user_id = v_user_id;

  IF v_already_shared IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Achievement not found');
  END IF;

  IF v_already_shared THEN
    RETURN json_build_object('success', false, 'error', 'Already shared', 'already_shared', true);
  END IF;

  -- Update achievement as shared
  UPDATE public.achievements
  SET shared = true, shared_at = now(), shared_platform = p_platform, coins_earned = v_coins_to_earn
  WHERE id = p_achievement_id AND user_id = v_user_id;

  -- Add coins to user
  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, source, description_ar)
  VALUES (v_user_id, v_coins_to_earn, 'earn', 'achievement_share', 'مكافأة مشاركة إنجاز');

  RETURN json_build_object(
    'success', true, 
    'coins_earned', v_coins_to_earn,
    'message', 'Achievement shared successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user monthly stats for wrap card
CREATE OR REPLACE FUNCTION public.get_monthly_stats(p_month INTEGER DEFAULT NULL, p_year INTEGER DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_month INTEGER;
  v_year INTEGER;
  v_total_expenses NUMERIC;
  v_expense_count INTEGER;
  v_top_category TEXT;
  v_top_category_amount NUMERIC;
  v_groups_count INTEGER;
  v_prev_month_total NUMERIC;
  v_savings NUMERIC;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Default to current month
  v_month := COALESCE(p_month, EXTRACT(MONTH FROM CURRENT_DATE));
  v_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE));

  -- Get total expenses for the month
  SELECT COALESCE(SUM(amount), 0), COUNT(*)
  INTO v_total_expenses, v_expense_count
  FROM public.expenses e
  JOIN public.group_members gm ON e.group_id = gm.group_id
  WHERE gm.user_id = v_user_id
  AND EXTRACT(MONTH FROM e.spent_at) = v_month
  AND EXTRACT(YEAR FROM e.spent_at) = v_year;

  -- Get top category
  SELECT c.name_ar, COALESCE(SUM(e.amount), 0)
  INTO v_top_category, v_top_category_amount
  FROM public.expenses e
  JOIN public.group_members gm ON e.group_id = gm.group_id
  LEFT JOIN public.categories c ON e.category_id = c.id
  WHERE gm.user_id = v_user_id
  AND EXTRACT(MONTH FROM e.spent_at) = v_month
  AND EXTRACT(YEAR FROM e.spent_at) = v_year
  GROUP BY c.name_ar
  ORDER BY SUM(e.amount) DESC
  LIMIT 1;

  -- Get active groups count
  SELECT COUNT(DISTINCT gm.group_id)
  INTO v_groups_count
  FROM public.group_members gm
  JOIN public.groups g ON gm.group_id = g.id
  WHERE gm.user_id = v_user_id
  AND g.archived_at IS NULL;

  -- Get previous month total for savings calculation
  SELECT COALESCE(SUM(amount), 0)
  INTO v_prev_month_total
  FROM public.expenses e
  JOIN public.group_members gm ON e.group_id = gm.group_id
  WHERE gm.user_id = v_user_id
  AND EXTRACT(MONTH FROM e.spent_at) = v_month - 1
  AND EXTRACT(YEAR FROM e.spent_at) = CASE WHEN v_month = 1 THEN v_year - 1 ELSE v_year END;

  v_savings := v_prev_month_total - v_total_expenses;

  RETURN json_build_object(
    'success', true,
    'month', v_month,
    'year', v_year,
    'total_expenses', v_total_expenses,
    'expense_count', v_expense_count,
    'top_category', COALESCE(v_top_category, 'غير محدد'),
    'top_category_amount', COALESCE(v_top_category_amount, 0),
    'groups_count', v_groups_count,
    'savings', v_savings,
    'prev_month_total', v_prev_month_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;