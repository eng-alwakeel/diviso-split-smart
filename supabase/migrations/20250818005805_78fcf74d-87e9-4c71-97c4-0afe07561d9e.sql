-- إصلاح جميع الـ functions لتكون immutable و secure
CREATE OR REPLACE FUNCTION public.get_group_budget_tracking_v2(p_group_id uuid)
 RETURNS TABLE(budget_id uuid, budget_name text, category_id uuid, category_name text, budgeted_amount numeric, spent_amount numeric, remaining_amount numeric, spent_percentage numeric, status text, expense_count integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- التحقق من عضوية المستخدم في المجموعة بشكل محسن
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = p_group_id 
    AND gm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_group_member' USING ERRCODE='28000';
  END IF;
  
  RETURN QUERY
  SELECT 
    b.id as budget_id,
    b.name as budget_name,
    bc.category_id,
    c.name_ar as category_name,
    bc.allocated_amount as budgeted_amount,
    COALESCE(spent.total_spent, 0) as spent_amount,
    bc.allocated_amount - COALESCE(spent.total_spent, 0) as remaining_amount,
    CASE 
      WHEN bc.allocated_amount > 0 
      THEN (COALESCE(spent.total_spent, 0) / bc.allocated_amount * 100)
      ELSE 0 
    END as spent_percentage,
    CASE 
      WHEN bc.allocated_amount = 0 THEN 'no_budget'
      WHEN COALESCE(spent.total_spent, 0) > bc.allocated_amount THEN 'exceeded'
      WHEN COALESCE(spent.total_spent, 0) / bc.allocated_amount >= 0.9 THEN 'critical'
      WHEN COALESCE(spent.total_spent, 0) / bc.allocated_amount >= 0.8 THEN 'warning'
      ELSE 'safe'
    END as status,
    COALESCE(spent.expense_count, 0)::integer as expense_count
  FROM budgets b
  JOIN budget_categories bc ON bc.budget_id = b.id
  LEFT JOIN categories c ON c.id = bc.category_id
  LEFT JOIN (
    SELECT 
      e.category_id,
      SUM(e.amount) as total_spent,
      COUNT(e.id) as expense_count
    FROM expenses e
    WHERE e.group_id = p_group_id 
    AND e.status = 'approved'
    GROUP BY e.category_id
  ) spent ON spent.category_id = bc.category_id
  WHERE b.group_id = p_group_id
  AND (b.end_date IS NULL OR b.end_date >= CURRENT_DATE)
  AND b.start_date <= CURRENT_DATE
  ORDER BY spent_percentage DESC NULLS LAST;
END;
$function$;

-- إصلاح دالة check_budget_alerts
CREATE OR REPLACE FUNCTION public.check_budget_alerts(p_group_id uuid)
 RETURNS TABLE(category_id uuid, category_name text, alert_type text, budgeted_amount numeric, spent_amount numeric, spent_percentage numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- التحقق من عضوية المستخدم في المجموعة
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = p_group_id 
    AND gm.user_id = auth.uid()
  ) THEN
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
  FROM public.get_group_budget_tracking_v2(p_group_id) bt
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