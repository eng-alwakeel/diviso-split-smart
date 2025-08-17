-- Admin activity statistics function
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