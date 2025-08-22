-- إصلاح باقي الـ functions التي تحتاج search_path

-- البحث عن الـ functions المتبقية وإصلاحها
CREATE OR REPLACE FUNCTION public.can_approve_group_expenses(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = p_group_id 
      AND gm.user_id = auth.uid() 
      AND (gm.role IN ('admin','owner') OR gm.can_approve_expenses = true)
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_users_for_admin()
RETURNS TABLE(id uuid, display_name text, name text, phone text, created_at timestamp with time zone, is_admin boolean, current_plan text, groups_count bigint, expenses_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.name,
    p.phone,
    p.created_at,
    p.is_admin,
    get_user_plan(p.id) as current_plan,
    (SELECT COUNT(*) FROM public.group_members gm WHERE gm.user_id = p.id) as groups_count,
    (SELECT COUNT(*) FROM public.expenses e WHERE e.created_by = p.id) as expenses_count
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_groups_for_admin()
RETURNS TABLE(id uuid, name text, currency text, owner_name text, created_at timestamp with time zone, members_count bigint, expenses_count bigint, total_amount numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    g.currency,
    COALESCE(p.display_name, p.name, 'Unknown') as owner_name,
    g.created_at,
    (SELECT COUNT(*) FROM public.group_members gm WHERE gm.group_id = g.id) as members_count,
    (SELECT COUNT(*) FROM public.expenses e WHERE e.group_id = g.id) as expenses_count,
    (SELECT COALESCE(SUM(e.amount), 0) FROM public.expenses e WHERE e.group_id = g.id AND e.status = 'approved') as total_amount
  FROM public.groups g
  LEFT JOIN public.profiles p ON p.id = g.owner_id
  ORDER BY g.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_group_budget_tracking(p_group_id uuid)
RETURNS TABLE(category_id uuid, category_name text, budgeted_amount numeric, spent_amount numeric, remaining_amount numeric, spent_percentage numeric, status text, expense_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_admin_subscription_stats()
RETURNS TABLE(plan_type text, total_users bigint, active_users bigint, trial_users bigint, expired_users bigint, monthly_revenue numeric, conversion_rate numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  RETURN QUERY
  WITH plan_stats AS (
    SELECT 
      COALESCE(us.plan::text, 'free') as plan,
      COUNT(*) as total,
      COUNT(CASE WHEN us.status = 'active' THEN 1 END) as active,
      COUNT(CASE WHEN us.status = 'trialing' THEN 1 END) as trialing,
      COUNT(CASE WHEN us.status IN ('canceled', 'expired') THEN 1 END) as expired
    FROM public.profiles p
    LEFT JOIN public.user_subscriptions us ON p.id = us.user_id
    GROUP BY COALESCE(us.plan::text, 'free')
  ),
  revenue_calc AS (
    SELECT 
      plan,
      CASE 
        WHEN plan = 'personal' THEN active * 29.99
        WHEN plan = 'family' THEN active * 49.99
        WHEN plan = 'lifetime' THEN 0
        ELSE 0
      END as revenue
    FROM plan_stats
  )
  SELECT 
    ps.plan,
    ps.total,
    ps.active,
    ps.trialing,
    ps.expired,
    COALESCE(rc.revenue, 0),
    CASE 
      WHEN ps.trialing > 0 THEN (ps.active::numeric / (ps.active + ps.trialing) * 100)
      ELSE 0
    END as conversion_rate
  FROM plan_stats ps
  LEFT JOIN revenue_calc rc ON ps.plan = rc.plan
  ORDER BY ps.total DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_group_with_token(p_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
declare
  v_token record;
  v_user_plan text;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode='28000';
  end if;

  select *
  into v_token
  from public.group_join_tokens t
  where t.token = p_token
    and t.expires_at > now()
  limit 1;

  if not found then
    raise exception 'invalid_or_expired_token' using errcode='22023';
  end if;

  -- التحقق من أن المستخدم ليس عضواً مسبقاً في المجموعة
  if exists (
    select 1 from public.group_members gm
    where gm.group_id = v_token.group_id and gm.user_id = auth.uid()
  ) then
    return v_token.group_id;
  end if;

  -- التحقق من حد الاستخدام إذا كان محدوداً
  if v_token.max_uses > 0 and v_token.current_uses >= v_token.max_uses then
    raise exception 'link_usage_exceeded' using errcode='22023';
  end if;

  -- إضافة المستخدم كعضو جديد
  insert into public.group_members (group_id, user_id, role)
  values (v_token.group_id, auth.uid(), v_token.role);

  -- تحديث عداد الاستخدام
  update public.group_join_tokens
  set current_uses = current_uses + 1
  where id = v_token.id;

  return v_token.group_id;
end;
$$;

CREATE OR REPLACE FUNCTION public.get_group_balance(p_group_id uuid)
RETURNS TABLE(user_id uuid, amount_paid numeric, amount_owed numeric, settlements_in numeric, settlements_out numeric, net_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_pending_amounts(p_group_id uuid)
RETURNS TABLE(user_id uuid, pending_paid numeric, pending_owed numeric, pending_net numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_balance_summary(p_group_id uuid)
RETURNS TABLE(user_id uuid, confirmed_paid numeric, confirmed_owed numeric, confirmed_net numeric, pending_paid numeric, pending_owed numeric, pending_net numeric, total_net numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;