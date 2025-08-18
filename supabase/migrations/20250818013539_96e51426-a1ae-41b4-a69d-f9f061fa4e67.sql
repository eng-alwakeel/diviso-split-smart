-- إزالة check_budget_limit trigger الذي يمنع تجاوز الميزانية
DROP TRIGGER IF EXISTS check_budget_limit_trigger ON public.expenses;

-- إضافة فئات "المشاريع" و "المبيعات" إذا لم تكن موجودة
INSERT INTO public.categories (name_ar, icon) 
SELECT 'مشاريع', 'briefcase'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name_ar = 'مشاريع');

INSERT INTO public.categories (name_ar, icon) 
SELECT 'مبيعات', 'shopping-bag'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name_ar = 'مبيعات');

-- إنشاء دالة لحساب تحذيرات الميزانية بدلاً من المنع
CREATE OR REPLACE FUNCTION public.get_budget_warnings(p_group_id uuid, p_category_id uuid, p_amount numeric)
RETURNS TABLE(
  warning_type text,
  message text,
  current_spent numeric,
  budget_limit numeric,
  remaining_amount numeric
) AS $$
DECLARE
  v_budget_limit numeric;
  v_current_spent numeric;
  v_new_total numeric;
BEGIN
  -- جلب معلومات الميزانية
  SELECT bc.allocated_amount INTO v_budget_limit
  FROM public.budget_categories bc
  JOIN public.budgets b ON bc.budget_id = b.id
  WHERE b.group_id = p_group_id 
    AND bc.category_id = p_category_id
    AND (b.end_date IS NULL OR b.end_date >= CURRENT_DATE)
    AND b.start_date <= CURRENT_DATE
  LIMIT 1;

  -- إذا لم توجد ميزانية، لا توجد تحذيرات
  IF v_budget_limit IS NULL THEN
    RETURN;
  END IF;

  -- حساب المبلغ المنفق حالياً
  SELECT COALESCE(SUM(e.amount), 0) INTO v_current_spent
  FROM public.expenses e 
  WHERE e.group_id = p_group_id 
    AND e.category_id = p_category_id 
    AND e.status = 'approved';

  v_new_total := v_current_spent + p_amount;

  -- إرجاع التحذير المناسب
  IF v_new_total > v_budget_limit THEN
    warning_type := 'exceed';
    message := 'هذا المصروف سيتجاوز الميزانية المحددة بمقدار ' || 
               (v_new_total - v_budget_limit)::text || ' ريال';
  ELSIF v_new_total / v_budget_limit >= 0.9 THEN
    warning_type := 'critical';
    message := 'تحذير: وصلت إلى 90% من الميزانية المحددة';
  ELSIF v_new_total / v_budget_limit >= 0.8 THEN
    warning_type := 'warning';
    message := 'تنبيه: وصلت إلى 80% من الميزانية المحددة';
  ELSE
    warning_type := 'safe';
    message := 'ضمن الميزانية المحددة';
  END IF;

  current_spent := v_current_spent;
  budget_limit := v_budget_limit;
  remaining_amount := v_budget_limit - v_new_total;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';