-- First, let's add category support to expenses if not already there
-- This ensures expenses are properly linked to categories
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id);

-- Create a function to get group budget tracking by categories
CREATE OR REPLACE FUNCTION public.get_group_budget_tracking(p_group_id uuid)
RETURNS TABLE(
  category_id uuid,
  category_name text,
  budgeted_amount numeric,
  spent_amount numeric,
  remaining_amount numeric,
  spent_percentage numeric,
  status text,
  expense_count integer
)
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
      b.category_id,
      COALESCE(b.amount_limit, b.total_amount) as budgeted_amount
    FROM public.budgets b 
    WHERE b.group_id = p_group_id 
      AND b.category_id IS NOT NULL
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
  ORDER BY spent_percentage DESC;
END;
$function$;

-- Create a function to check budget alerts for a group
CREATE OR REPLACE FUNCTION public.check_budget_alerts(p_group_id uuid)
RETURNS TABLE(
  category_id uuid,
  category_name text,
  alert_type text,
  budgeted_amount numeric,
  spent_amount numeric,
  spent_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_group_member(p_group_id) THEN
    RAISE EXCEPTION 'not_group_member' USING ERRCODE='28000';
  END IF;
  
  RETURN QUERY
  SELECT 
    bt.category_id,
    bt.category_name,
    bt.status as alert_type,
    bt.budgeted_amount,
    bt.spent_amount,
    bt.spent_percentage
  FROM public.get_group_budget_tracking(p_group_id) bt
  WHERE bt.status IN ('warning', 'critical', 'exceeded')
    AND bt.budgeted_amount > 0
  ORDER BY 
    CASE bt.status 
      WHEN 'exceeded' THEN 1
      WHEN 'critical' THEN 2 
      WHEN 'warning' THEN 3
      ELSE 4
    END,
    bt.spent_percentage DESC;
END;
$function$;