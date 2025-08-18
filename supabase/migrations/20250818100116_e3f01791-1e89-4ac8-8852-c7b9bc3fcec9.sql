-- تحديث دالة تحذيرات الميزانية لتشمل الأنواع الثلاثة المطلوبة
CREATE OR REPLACE FUNCTION public.get_budget_warnings(p_group_id uuid, p_category_id uuid, p_amount numeric)
 RETURNS TABLE(warning_type text, message text, current_spent numeric, budget_limit numeric, remaining_amount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_budget_limit numeric;
  v_current_spent numeric;
  v_new_total numeric;
  v_spent_percentage numeric;
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
  IF v_budget_limit IS NULL OR v_budget_limit <= 0 THEN
    RETURN;
  END IF;

  -- حساب المبلغ المنفق حالياً
  SELECT COALESCE(SUM(e.amount), 0) INTO v_current_spent
  FROM public.expenses e 
  WHERE e.group_id = p_group_id 
    AND e.category_id = p_category_id 
    AND e.status = 'approved';

  v_new_total := v_current_spent + p_amount;
  v_spent_percentage := (v_new_total / v_budget_limit) * 100;

  -- تحديد نوع التحذير حسب النسبة المئوية
  IF v_new_total > v_budget_limit THEN
    -- تجاوز الميزانية
    warning_type := 'exceed';
    message := 'تم تجاوز الميزانية! هذا المصروف سيزيد التجاوز بمقدار ' || 
               (v_new_total - v_budget_limit)::text || ' ريال';
  ELSIF v_spent_percentage >= 80 THEN
    -- استنفاذ الميزانية (80% فأكثر)
    warning_type := 'depletion';
    message := 'تحذير: تم استنفاذ ' || ROUND(v_spent_percentage, 1)::text || 
               '% من الميزانية. يرجى المراجعة قبل المتابعة';
  ELSIF v_spent_percentage <= 50 THEN
    -- توفير في الميزانية (أقل من 50%)
    warning_type := 'savings';
    message := 'ممتاز! لديك توفير جيد في هذه الفئة. تم استخدام ' || 
               ROUND(v_spent_percentage, 1)::text || '% فقط من الميزانية';
  ELSE
    -- الحالة العادية (بين 50-80%)
    warning_type := 'normal';
    message := 'ضمن الحدود الطبيعية. تم استخدام ' || 
               ROUND(v_spent_percentage, 1)::text || '% من الميزانية';
  END IF;

  current_spent := v_current_spent;
  budget_limit := v_budget_limit;
  remaining_amount := v_budget_limit - v_new_total;

  RETURN NEXT;
END;
$function$;