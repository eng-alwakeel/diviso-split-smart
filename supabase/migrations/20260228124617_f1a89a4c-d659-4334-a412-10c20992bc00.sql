
-- Fix 1: get_balance_summary - fix search_path so is_group_member() is found
CREATE OR REPLACE FUNCTION public.get_balance_summary(p_group_id uuid)
 RETURNS TABLE(user_id uuid, confirmed_paid numeric, confirmed_owed numeric, confirmed_net numeric, pending_paid numeric, pending_owed numeric, pending_net numeric, total_net numeric)
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
    gb.user_id,
    gb.amount_paid AS confirmed_paid,
    gb.amount_owed AS confirmed_owed,
    gb.net_balance AS confirmed_net,
    pa.pending_paid,
    pa.pending_owed,
    pa.pending_net,
    gb.net_balance + pa.pending_net AS total_net
  FROM public.get_group_balance(p_group_id) gb
  LEFT JOIN public.get_pending_amounts(p_group_id) pa ON gb.user_id = pa.user_id;
END;
$function$;

-- Fix 2: get_pending_amounts - fix search_path so is_group_member() is found
CREATE OR REPLACE FUNCTION public.get_pending_amounts(p_group_id uuid)
 RETURNS TABLE(user_id uuid, pending_paid numeric, pending_owed numeric, pending_net numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_group_member(p_group_id) THEN
    RAISE EXCEPTION 'not_group_member' USING ERRCODE='28000';
  END IF;
  RETURN QUERY
  WITH members AS (
    SELECT DISTINCT gm.user_id
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
  ),
  pending_paid AS (
    SELECT e.payer_id AS uid, COALESCE(SUM(e.amount),0) AS pp
    FROM public.expenses e
    WHERE e.group_id = p_group_id AND e.status = 'pending'
    GROUP BY e.payer_id
  ),
  pending_owed AS (
    SELECT es.member_id AS uid, COALESCE(SUM(es.share_amount),0) AS po
    FROM public.expense_splits es
    JOIN public.expenses e ON e.id = es.expense_id AND e.group_id = p_group_id AND e.status = 'pending'
    GROUP BY es.member_id
  )
  SELECT m.user_id,
         COALESCE(pp.pp,0) AS pending_paid,
         COALESCE(po.po,0) AS pending_owed,
         COALESCE(pp.pp,0) - COALESCE(po.po,0) AS pending_net
  FROM members m
  LEFT JOIN pending_paid pp ON pp.uid = m.user_id
  LEFT JOIN pending_owed po ON po.uid = m.user_id;
END;
$function$;

-- Fix 3: check_budget_alerts - fix search_path AND fix column name mismatches
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
    CASE 
      WHEN bt.percentage_used > 100 THEN 'exceeded'
      WHEN bt.percentage_used >= 90 THEN 'critical'
      WHEN bt.percentage_used >= 80 THEN 'warning'
      ELSE 'safe'
    END as alert_type,
    bt.allocated_amount as budgeted_amount,
    bt.spent_amount,
    bt.percentage_used as spent_percentage
  FROM public.get_group_budget_tracking_v2(p_group_id) bt
  WHERE bt.percentage_used >= 80
    AND bt.allocated_amount > 0
  ORDER BY 
    CASE 
      WHEN bt.percentage_used > 100 THEN 1
      WHEN bt.percentage_used >= 90 THEN 2
      WHEN bt.percentage_used >= 80 THEN 3
      ELSE 4
    END,
    bt.percentage_used DESC;
END;
$function$;
