-- Create RPC function to get users grouped by city with coordinates
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
    urs.default_city as city,
    COUNT(*)::bigint as user_count,
    AVG(urs.last_location_lat) as avg_lat,
    AVG(urs.last_location_lng) as avg_lng
  FROM public.user_recommendation_settings urs
  WHERE urs.default_city IS NOT NULL 
    AND urs.default_city != ''
  GROUP BY urs.default_city
  ORDER BY user_count DESC;
END;
$$;