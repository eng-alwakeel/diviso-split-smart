-- Admin insights and management functions
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