-- Update get_group_budget_tracking function to work with new schema
CREATE OR REPLACE FUNCTION public.get_group_budget_tracking(p_group_id uuid)
RETURNS TABLE(category_id uuid, category_name text, budgeted_amount numeric, spent_amount numeric, remaining_amount numeric, spent_percentage numeric, status text, expense_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_group_member(p_group_id) THEN
    RAISE EXCEPTION 'not_group_member' USING ERRCODE='28000';
  END IF;
  
  RETURN QUERY
  WITH budget_data AS (
    SELECT 
      bc.category_id,
      bc.allocated_amount as budgeted_amount
    FROM public.budget_categories bc
    JOIN public.budgets b ON bc.budget_id = b.id
    WHERE b.group_id = p_group_id 
      AND bc.category_id IS NOT NULL
      AND (b.end_date IS NULL OR b.end_date >= CURRENT_DATE)
      AND b.start_date <= CURRENT_DATE
  ),
  expense_data AS (
    SELECT 
      e.category_id,
      COALESCE(SUM(e.amount), 0) as spent_amount,
      COUNT(e.id)::integer as expense_count
    FROM public.expenses e
    WHERE e.group_id = p_group_id 
      AND e.status = 'approved'
      AND e.category_id IS NOT NULL
    GROUP BY e.category_id
  )
  SELECT 
    COALESCE(bd.category_id, ed.category_id) as category_id,
    c.name_ar as category_name,
    COALESCE(bd.budgeted_amount, 0) as budgeted_amount,
    COALESCE(ed.spent_amount, 0) as spent_amount,
    COALESCE(bd.budgeted_amount, 0) - COALESCE(ed.spent_amount, 0) as remaining_amount,
    CASE 
      WHEN COALESCE(bd.budgeted_amount, 0) > 0 
      THEN (COALESCE(ed.spent_amount, 0) / bd.budgeted_amount * 100)
      ELSE 0 
    END as spent_percentage,
    CASE 
      WHEN COALESCE(bd.budgeted_amount, 0) = 0 THEN 'no_budget'
      WHEN COALESCE(ed.spent_amount, 0) > bd.budgeted_amount THEN 'exceeded'
      WHEN COALESCE(ed.spent_amount, 0) / bd.budgeted_amount >= 0.9 THEN 'critical'
      WHEN COALESCE(ed.spent_amount, 0) / bd.budgeted_amount >= 0.8 THEN 'warning'
      ELSE 'safe'
    END as status,
    COALESCE(ed.expense_count, 0) as expense_count
  FROM budget_data bd
  FULL OUTER JOIN expense_data ed ON bd.category_id = ed.category_id
  LEFT JOIN public.categories c ON COALESCE(bd.category_id, ed.category_id) = c.id
  WHERE COALESCE(bd.category_id, ed.category_id) IS NOT NULL
  ORDER BY spent_percentage DESC;
END;
$function$;