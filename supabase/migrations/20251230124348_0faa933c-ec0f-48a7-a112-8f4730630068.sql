-- إصلاح دالة auto_link_expense_to_budget لجعل ربط الميزانية اختياري
CREATE OR REPLACE FUNCTION public.auto_link_expense_to_budget()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- محاولة ربط المصروف بميزانية (اختياري - لا يفشل المصروف إذا لم توجد ميزانية)
  BEGIN
    INSERT INTO public.expense_budget_links (expense_id, budget_category_id)
    SELECT 
      NEW.id,
      bc.id
    FROM public.budget_categories bc
    JOIN public.budgets b ON b.id = bc.budget_id
    WHERE bc.category_id = NEW.category_id
    AND b.group_id = NEW.group_id
    AND (b.end_date IS NULL OR b.end_date >= CURRENT_DATE)
    AND b.start_date <= CURRENT_DATE
    LIMIT 1
    ON CONFLICT (expense_id, budget_category_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- تجاهل أي خطأ - الربط بالميزانية اختياري
    NULL;
  END;
  
  RETURN NEW;
END;
$$;

-- إصلاح دالة join_group_with_token
CREATE OR REPLACE FUNCTION public.join_group_with_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_token_record RECORD;
  v_user_id uuid;
  v_existing_member RECORD;
  v_result json;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  SELECT * INTO v_token_record
  FROM public.group_join_tokens
  WHERE token = p_token
  AND expires_at > now()
  AND (max_uses IS NULL OR current_uses < max_uses);

  IF v_token_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired token');
  END IF;

  SELECT * INTO v_existing_member
  FROM public.group_members
  WHERE group_id = v_token_record.group_id
  AND user_id = v_user_id;

  IF v_existing_member IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already a member', 'group_id', v_token_record.group_id);
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_token_record.group_id, v_user_id, v_token_record.role);

  UPDATE public.group_join_tokens
  SET current_uses = COALESCE(current_uses, 0) + 1,
      used_at = now(),
      used_by = v_user_id
  WHERE id = v_token_record.id;

  RETURN json_build_object('success', true, 'group_id', v_token_record.group_id);
END;
$$;

-- إصلاح دالة check_and_create_achievements
CREATE OR REPLACE FUNCTION public.check_and_create_achievements(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_expense_count integer;
  v_group_count integer;
  v_referral_count integer;
  v_total_amount numeric;
BEGIN
  SELECT COUNT(*) INTO v_expense_count
  FROM public.expenses WHERE created_by = p_user_id;

  SELECT COUNT(*) INTO v_group_count
  FROM public.group_members WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_referral_count
  FROM public.referrals WHERE inviter_id = p_user_id AND status = 'completed';

  SELECT COALESCE(SUM(amount), 0) INTO v_total_amount
  FROM public.expenses WHERE created_by = p_user_id;

  IF v_expense_count >= 1 THEN
    INSERT INTO public.achievements (user_id, achievement_type, achievement_value, achievement_level)
    VALUES (p_user_id, 'first_expense', 1, 'bronze')
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  IF v_expense_count >= 10 THEN
    INSERT INTO public.achievements (user_id, achievement_type, achievement_value, achievement_level)
    VALUES (p_user_id, 'expense_count', 10, 'silver')
    ON CONFLICT (user_id, achievement_type) DO UPDATE SET achievement_value = 10, achievement_level = 'silver';
  END IF;

  IF v_expense_count >= 50 THEN
    INSERT INTO public.achievements (user_id, achievement_type, achievement_value, achievement_level)
    VALUES (p_user_id, 'expense_count', 50, 'gold')
    ON CONFLICT (user_id, achievement_type) DO UPDATE SET achievement_value = 50, achievement_level = 'gold';
  END IF;

  IF v_group_count >= 1 THEN
    INSERT INTO public.achievements (user_id, achievement_type, achievement_value, achievement_level)
    VALUES (p_user_id, 'first_group', 1, 'bronze')
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  IF v_referral_count >= 1 THEN
    INSERT INTO public.achievements (user_id, achievement_type, achievement_value, achievement_level)
    VALUES (p_user_id, 'first_referral', 1, 'bronze')
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  IF v_referral_count >= 5 THEN
    INSERT INTO public.achievements (user_id, achievement_type, achievement_value, achievement_level)
    VALUES (p_user_id, 'referral_count', 5, 'silver')
    ON CONFLICT (user_id, achievement_type) DO UPDATE SET achievement_value = 5, achievement_level = 'silver';
  END IF;
END;
$$;

-- إصلاح دالة share_achievement
CREATE OR REPLACE FUNCTION public.share_achievement(p_achievement_id uuid, p_platform text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_achievement RECORD;
  v_coins_reward integer := 5;
BEGIN
  SELECT * INTO v_achievement
  FROM public.achievements
  WHERE id = p_achievement_id
  AND user_id = auth.uid();

  IF v_achievement IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Achievement not found');
  END IF;

  IF v_achievement.shared = true THEN
    RETURN json_build_object('success', false, 'error', 'Already shared');
  END IF;

  UPDATE public.achievements
  SET shared = true,
      shared_at = now(),
      shared_platform = p_platform,
      coins_earned = v_coins_reward
  WHERE id = p_achievement_id;

  PERFORM public.add_coins(auth.uid(), v_coins_reward, 'achievement_share', 'مكافأة مشاركة إنجاز');

  RETURN json_build_object('success', true, 'coins_earned', v_coins_reward);
END;
$$;

-- إصلاح دالة get_monthly_stats
CREATE OR REPLACE FUNCTION public.get_monthly_stats(p_user_id uuid, p_year integer, p_month integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_expenses numeric;
  v_expense_count integer;
  v_top_category text;
  v_groups_count integer;
BEGIN
  SELECT COALESCE(SUM(e.amount), 0), COUNT(*)
  INTO v_total_expenses, v_expense_count
  FROM public.expenses e
  JOIN public.group_members gm ON gm.group_id = e.group_id
  WHERE gm.user_id = p_user_id
  AND EXTRACT(YEAR FROM e.spent_at) = p_year
  AND EXTRACT(MONTH FROM e.spent_at) = p_month;

  SELECT c.name_ar INTO v_top_category
  FROM public.expenses e
  JOIN public.categories c ON c.id = e.category_id
  JOIN public.group_members gm ON gm.group_id = e.group_id
  WHERE gm.user_id = p_user_id
  AND EXTRACT(YEAR FROM e.spent_at) = p_year
  AND EXTRACT(MONTH FROM e.spent_at) = p_month
  GROUP BY c.name_ar
  ORDER BY SUM(e.amount) DESC
  LIMIT 1;

  SELECT COUNT(DISTINCT group_id) INTO v_groups_count
  FROM public.group_members
  WHERE user_id = p_user_id;

  RETURN json_build_object(
    'total_expenses', v_total_expenses,
    'expense_count', v_expense_count,
    'top_category', v_top_category,
    'groups_count', v_groups_count
  );
END;
$$;

-- إصلاح دالة notify_new_message إذا كانت موجودة
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, payload)
  SELECT 
    gm.user_id,
    'new_message',
    jsonb_build_object(
      'group_id', NEW.group_id,
      'sender_id', NEW.sender_id,
      'message_preview', LEFT(NEW.content, 100)
    )
  FROM public.group_members gm
  WHERE gm.group_id = NEW.group_id
  AND gm.user_id != NEW.sender_id;
  
  RETURN NEW;
END;
$$;