-- إزالة check_budget_limit trigger الذي يمنع تجاوز الميزانية
DROP TRIGGER IF EXISTS check_budget_limit_trigger ON public.expenses;

-- إضافة فئات "المشاريع" و "المبيعات" إذا لم تكن موجودة
INSERT INTO public.categories (name_ar, icon) VALUES
  ('مشاريع', 'briefcase'),
  ('مبيعات', 'shopping-bag')
ON CONFLICT (name_ar) DO NOTHING;

-- إنشاء دالة لحساب تحذيرات الميزانية بدلاً من المنع
CREATE OR REPLACE FUNCTION public.get_budget_warnings(p_group_id uuid, p_category_id uuid, p_amount numeric)
RETURNS TABLE(
  warning_type text,
  message text,
  current_spent numeric,
  budget_limit numeric,
  remaining_amount numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH budget_info AS (
    SELECT 
      bc.allocated_amount as budget_limit,
      COALESCE(
        (SELECT SUM(e.amount) FROM public.expenses e 
         WHERE e.group_id = p_group_id 
           AND e.category_id = p_category_id 
           AND e.status = 'approved'), 
        0
      ) as current_spent
    FROM public.budget_categories bc
    JOIN public.budgets b ON bc.budget_id = b.id
    WHERE b.group_id = p_group_id 
      AND bc.category_id = p_category_id
      AND (b.end_date IS NULL OR b.end_date >= CURRENT_DATE)
      AND b.start_date <= CURRENT_DATE
    LIMIT 1
  )
  SELECT 
    CASE 
      WHEN (bi.current_spent + p_amount) > bi.budget_limit THEN 'exceed'
      WHEN (bi.current_spent + p_amount) / bi.budget_limit >= 0.9 THEN 'critical'
      WHEN (bi.current_spent + p_amount) / bi.budget_limit >= 0.8 THEN 'warning'
      ELSE 'safe'
    END as warning_type,
    CASE 
      WHEN (bi.current_spent + p_amount) > bi.budget_limit THEN 
        'هذا المصروف سيتجاوز الميزانية المحددة بمقدار ' || 
        ((bi.current_spent + p_amount) - bi.budget_limit)::text || ' ريال'
      WHEN (bi.current_spent + p_amount) / bi.budget_limit >= 0.9 THEN 
        'تحذير: وصلت إلى 90% من الميزانية المحددة'
      WHEN (bi.current_spent + p_amount) / bi.budget_limit >= 0.8 THEN 
        'تنبيه: وصلت إلى 80% من الميزانية المحددة'
      ELSE 'ضمن الميزانية المحددة'
    END as message,
    bi.current_spent,
    bi.budget_limit,
    bi.budget_limit - (bi.current_spent + p_amount) as remaining_amount
  FROM budget_info bi
  WHERE bi.budget_limit IS NOT NULL;