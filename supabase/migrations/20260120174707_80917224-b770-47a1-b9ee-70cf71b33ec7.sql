CREATE OR REPLACE FUNCTION public.get_users_by_city()
RETURNS TABLE(
  city text,
  user_count bigint,
  avg_lat double precision,
  avg_lng double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(urs.default_city, 'غير محدد') as city,
    COUNT(DISTINCT au.id)::bigint as user_count,
    AVG(urs.last_location_lat) as avg_lat,
    AVG(urs.last_location_lng) as avg_lng
  FROM auth.users au
  LEFT JOIN public.user_recommendation_settings urs ON urs.user_id = au.id
  GROUP BY COALESCE(urs.default_city, 'غير محدد')
  ORDER BY user_count DESC;
END;
$$;