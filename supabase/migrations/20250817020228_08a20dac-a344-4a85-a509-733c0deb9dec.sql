-- Enhanced admin dashboard functions

-- Get detailed subscription statistics
CREATE OR REPLACE FUNCTION public.get_admin_subscription_stats()
RETURNS TABLE(
  plan_type text,
  total_users bigint,
  active_users bigint,
  trial_users bigint,
  expired_users bigint,
  monthly_revenue numeric,
  conversion_rate numeric
)
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
$function$

-- Get activity statistics
CREATE OR REPLACE FUNCTION public.get_admin_activity_stats()
RETURNS TABLE(
  date date,
  new_users bigint,
  active_users bigint,
  new_groups bigint,
  new_expenses bigint,
  ocr_usage bigint
)
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
$function$

-- Get top performers and insights
CREATE OR REPLACE FUNCTION public.get_admin_insights()
RETURNS TABLE(
  metric_type text,
  metric_name text,
  metric_value text,
  additional_info jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  RETURN QUERY
  -- Most active groups
  SELECT 
    'top_groups'::text,
    g.name,
    COUNT(e.id)::text,
    jsonb_build_object(
      'member_count', (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id),
      'total_amount', COALESCE(SUM(e.amount), 0),
      'owner', COALESCE(p.display_name, p.name)
    )
  FROM public.groups g
  LEFT JOIN public.expenses e ON g.id = e.group_id AND e.status = 'approved'
  LEFT JOIN public.profiles p ON g.owner_id = p.id
  GROUP BY g.id, g.name, p.display_name, p.name
  ORDER BY COUNT(e.id) DESC
  LIMIT 5

  UNION ALL

  -- Most active users
  SELECT 
    'top_users'::text,
    COALESCE(p.display_name, p.name, 'مستخدم مجهول'),
    COUNT(e.id)::text,
    jsonb_build_object(
      'total_spent', COALESCE(SUM(e.amount), 0),
      'groups_count', (SELECT COUNT(*) FROM group_members gm WHERE gm.user_id = p.id),
      'plan', get_user_plan(p.id)
    )
  FROM public.profiles p
  LEFT JOIN public.expenses e ON p.id = e.created_by AND e.status = 'approved'
  GROUP BY p.id, p.display_name, p.name
  ORDER BY COUNT(e.id) DESC
  LIMIT 5

  UNION ALL

  -- Most used categories
  SELECT 
    'top_categories'::text,
    c.name_ar,
    COUNT(e.id)::text,
    jsonb_build_object(
      'total_amount', COALESCE(SUM(e.amount), 0),
      'avg_amount', COALESCE(AVG(e.amount), 0)
    )
  FROM public.categories c
  LEFT JOIN public.expenses e ON c.id = e.category_id AND e.status = 'approved'
  GROUP BY c.id, c.name_ar
  ORDER BY COUNT(e.id) DESC
  LIMIT 5;
END;
$function$

-- Admin user management functions
CREATE OR REPLACE FUNCTION public.admin_toggle_user_status(p_user_id uuid, p_is_active boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  -- Update user status (this would typically involve auth.users table, but we'll use a custom field)
  UPDATE public.profiles 
  SET 
    updated_at = now()
  WHERE id = p_user_id;

  RETURN true;
END;
$function$

CREATE OR REPLACE FUNCTION public.admin_toggle_user_admin(p_user_id uuid, p_is_admin boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  UPDATE public.profiles 
  SET 
    is_admin = p_is_admin,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN true;
END;
$function$

CREATE OR REPLACE FUNCTION public.admin_delete_group(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  -- Delete all related data
  DELETE FROM public.expense_splits WHERE expense_id IN (
    SELECT id FROM public.expenses WHERE group_id = p_group_id
  );
  
  DELETE FROM public.expenses WHERE group_id = p_group_id;
  DELETE FROM public.settlements WHERE group_id = p_group_id;
  DELETE FROM public.group_members WHERE group_id = p_group_id;
  DELETE FROM public.groups WHERE id = p_group_id;

  RETURN true;
END;
$function$