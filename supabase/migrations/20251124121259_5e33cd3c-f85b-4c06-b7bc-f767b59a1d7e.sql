-- Fix search_path for all admin RPC functions to resolve "function is_admin_user() does not exist" error

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE(total_users bigint, total_groups bigint, total_expenses bigint, total_amount numeric, active_subscriptions bigint, monthly_revenue numeric, new_users_this_month bigint, active_users_today bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.groups) as total_groups,
    (SELECT COUNT(*) FROM public.expenses WHERE status = 'approved') as total_expenses,
    (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE status = 'approved') as total_amount,
    (SELECT COUNT(*) FROM public.user_subscriptions WHERE status IN ('active', 'trialing')) as active_subscriptions,
    (SELECT COALESCE(SUM(
      CASE 
        WHEN us.plan = 'premium' THEN 29.99
        WHEN us.plan = 'family' THEN 49.99
        ELSE 0
      END
    ), 0) FROM public.user_subscriptions us WHERE us.status = 'active') as monthly_revenue,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= date_trunc('month', now())) as new_users_this_month,
    (SELECT COUNT(DISTINCT user_id) FROM public.expenses WHERE created_at >= current_date) as active_users_today;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_users_for_admin()
RETURNS TABLE(id uuid, display_name text, name text, phone text, created_at timestamp with time zone, is_admin boolean, current_plan text, groups_count bigint, expenses_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_groups_for_admin()
RETURNS TABLE(id uuid, name text, currency text, owner_name text, created_at timestamp with time zone, members_count bigint, expenses_count bigint, total_amount numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_subscription_stats()
RETURNS TABLE(plan_type text, total_users bigint, active_users bigint, trial_users bigint, expired_users bigint, monthly_revenue numeric, conversion_rate numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_activity_stats()
RETURNS TABLE(date date, new_users bigint, active_users bigint, new_groups bigint, new_expenses bigint, ocr_usage bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '30 days',
      CURRENT_DATE,
      INTERVAL '1 day'
    )::date as date
  )
  SELECT 
    ds.date,
    COALESCE(COUNT(DISTINCT p.id), 0) as new_users,
    COALESCE(COUNT(DISTINCT e.created_by), 0) as active_users,
    COALESCE(COUNT(DISTINCT g.id), 0) as new_groups,
    COALESCE(COUNT(DISTINCT e.id), 0) as new_expenses,
    COALESCE(COUNT(DISTINCT r.id), 0) as ocr_usage
  FROM date_series ds
  LEFT JOIN public.profiles p ON ds.date = p.created_at::date
  LEFT JOIN public.expenses e ON ds.date = e.created_at::date
  LEFT JOIN public.groups g ON ds.date = g.created_at::date
  LEFT JOIN public.receipt_ocr r ON ds.date = r.created_at::date
  GROUP BY ds.date
  ORDER BY ds.date DESC;
END;
$function$;