-- حذف الدالة القديمة أولاً
DROP FUNCTION IF EXISTS public.get_group_budget_tracking_v2(uuid);

-- إعادة إنشاء دالة تتبع الميزانية بالنوع الصحيح
CREATE OR REPLACE FUNCTION public.get_group_budget_tracking_v2(p_group_id uuid)
RETURNS TABLE(
  budget_id uuid,
  budget_name text,
  category_id uuid,
  category_name text,
  allocated_amount numeric,
  spent_amount numeric,
  remaining_amount numeric,
  percentage_used numeric,
  expense_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as budget_id,
    b.name as budget_name,
    bc.category_id,
    bc.name as category_name,
    bc.allocated_amount,
    COALESCE(spent.total_spent, 0) as spent_amount,
    bc.allocated_amount - COALESCE(spent.total_spent, 0) as remaining_amount,
    CASE 
      WHEN bc.allocated_amount > 0 THEN 
        ROUND((COALESCE(spent.total_spent, 0) / bc.allocated_amount) * 100, 2)
      ELSE 0
    END as percentage_used,
    COALESCE(spent.expense_count, 0) as expense_count
  FROM public.budgets b
  JOIN public.budget_categories bc ON bc.budget_id = b.id
  LEFT JOIN (
    SELECT 
      ebl.budget_category_id,
      SUM(e.amount) as total_spent,
      COUNT(e.id) as expense_count
    FROM public.expenses e
    JOIN public.expense_budget_links ebl ON ebl.expense_id = e.id
    WHERE e.group_id = p_group_id 
    AND e.status = 'approved'
    GROUP BY ebl.budget_category_id
  ) spent ON spent.budget_category_id = bc.id
  WHERE b.group_id = p_group_id
  AND (b.end_date IS NULL OR b.end_date >= CURRENT_DATE)
  AND b.start_date <= CURRENT_DATE
  ORDER BY b.name, bc.name;
END;
$$;

-- دالة ربط المصاريف المعتمدة القديمة
CREATE OR REPLACE FUNCTION public.relink_approved_expenses(p_group_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  linked_count integer := 0;
BEGIN
  INSERT INTO public.expense_budget_links (expense_id, budget_category_id)
  SELECT DISTINCT ON (e.id)
    e.id,
    bc.id
  FROM public.expenses e
  JOIN public.budget_categories bc ON bc.category_id = e.category_id
  JOIN public.budgets b ON b.id = bc.budget_id AND b.group_id = e.group_id
  WHERE e.group_id = p_group_id
  AND e.status = 'approved'
  AND e.category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.expense_budget_links ebl WHERE ebl.expense_id = e.id
  )
  AND (b.end_date IS NULL OR b.end_date >= CURRENT_DATE)
  AND b.start_date <= CURRENT_DATE
  ON CONFLICT (expense_id, budget_category_id) DO NOTHING;
  
  GET DIAGNOSTICS linked_count = ROW_COUNT;
  RETURN linked_count;
END;
$$;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.get_group_budget_tracking_v2(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.relink_approved_expenses(uuid) TO authenticated;