-- Fix balance calculation to only include approved expenses
CREATE OR REPLACE FUNCTION public.get_group_balance(p_group_id uuid)
 RETURNS TABLE(user_id uuid, amount_paid numeric, amount_owed numeric, settlements_in numeric, settlements_out numeric, net_balance numeric)
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
  paid AS (
    SELECT e.payer_id AS user_id, COALESCE(SUM(e.amount),0) AS amount_paid
    FROM public.expenses e
    WHERE e.group_id = p_group_id AND e.status = 'approved'
    GROUP BY e.payer_id
  ),
  owed AS (
    SELECT es.member_id AS user_id, COALESCE(SUM(es.share_amount),0) AS amount_owed
    FROM public.expense_splits es
    JOIN public.expenses e ON e.id = es.expense_id AND e.group_id = p_group_id AND e.status = 'approved'
    GROUP BY es.member_id
  ),
  sin AS (
    SELECT s.to_user_id AS user_id, COALESCE(SUM(s.amount),0) AS settlements_in
    FROM public.settlements s WHERE s.group_id = p_group_id GROUP BY s.to_user_id
  ),
  sout AS (
    SELECT s.from_user_id AS user_id, COALESCE(SUM(s.amount),0) AS settlements_out
    FROM public.settlements s WHERE s.group_id = p_group_id GROUP BY s.from_user_id
  )
  SELECT m.user_id,
         COALESCE(p.amount_paid,0) AS amount_paid,
         COALESCE(o.amount_owed,0) AS amount_owed,
         COALESCE(si.settlements_in,0) AS settlements_in,
         COALESCE(so.settlements_out,0) AS settlements_out,
         COALESCE(p.amount_paid,0) - COALESCE(o.amount_owed,0) + COALESCE(si.settlements_in,0) - COALESCE(so.settlements_out,0) AS net_balance
  FROM members m
  LEFT JOIN paid p ON p.user_id = m.user_id
  LEFT JOIN owed o ON o.user_id = m.user_id
  LEFT JOIN sin si ON si.user_id = m.user_id
  LEFT JOIN sout so ON so.user_id = m.user_id;
END;
$function$;

-- Create function to get pending amounts
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
    SELECT e.payer_id AS user_id, COALESCE(SUM(e.amount),0) AS pending_paid
    FROM public.expenses e
    WHERE e.group_id = p_group_id AND e.status = 'pending'
    GROUP BY e.payer_id
  ),
  pending_owed AS (
    SELECT es.member_id AS user_id, COALESCE(SUM(es.share_amount),0) AS pending_owed
    FROM public.expense_splits es
    JOIN public.expenses e ON e.id = es.expense_id AND e.group_id = p_group_id AND e.status = 'pending'
    GROUP BY es.member_id
  )
  SELECT m.user_id,
         COALESCE(pp.pending_paid,0) AS pending_paid,
         COALESCE(po.pending_owed,0) AS pending_owed,
         COALESCE(pp.pending_paid,0) - COALESCE(po.pending_owed,0) AS pending_net
  FROM members m
  LEFT JOIN pending_paid pp ON pp.user_id = m.user_id
  LEFT JOIN pending_owed po ON po.user_id = m.user_id;
END;
$function$;

-- Create function to get complete balance summary (approved + pending)
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