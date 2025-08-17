-- Create admin roles system
ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Update the admin function to check actual admin status
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$function$;

-- Create admin-only policies
CREATE POLICY "Only admins can view all profiles" ON public.profiles
FOR SELECT USING (is_admin_user() OR id = auth.uid());

-- Create admin analytics functions
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE(
  total_users bigint,
  total_groups bigint,
  total_expenses bigint,
  total_amount numeric,
  active_subscriptions bigint,
  monthly_revenue numeric,
  new_users_this_month bigint,
  active_users_today bigint
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

-- Create function to get user management data
CREATE OR REPLACE FUNCTION public.get_users_for_admin()
RETURNS TABLE(
  id uuid,
  display_name text,
  name text,
  phone text,
  created_at timestamptz,
  is_admin boolean,
  current_plan text,
  groups_count bigint,
  expenses_count bigint
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

-- Create function to get groups management data
CREATE OR REPLACE FUNCTION public.get_groups_for_admin()
RETURNS TABLE(
  id uuid,
  name text,
  currency text,
  owner_name text,
  created_at timestamptz,
  members_count bigint,
  expenses_count bigint,
  total_amount numeric
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