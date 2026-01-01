CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_groups BIGINT,
  total_expenses BIGINT,
  total_amount DECIMAL,
  active_subscriptions BIGINT,
  monthly_revenue DECIMAL,
  new_users_this_month BIGINT,
  active_users_today BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
        WHEN us.plan = 'personal' THEN 29.99
        WHEN us.plan = 'family' THEN 49.99
        WHEN us.plan = 'lifetime' THEN 99.99
        ELSE 0
      END
    ), 0) FROM public.user_subscriptions us WHERE us.status = 'active') as monthly_revenue,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= date_trunc('month', now())) as new_users_this_month,
    (SELECT COUNT(DISTINCT user_id) FROM public.expenses WHERE created_at >= current_date) as active_users_today;
END;
$$;