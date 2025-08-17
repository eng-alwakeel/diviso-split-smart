-- Enhanced admin dashboard subscription statistics function
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