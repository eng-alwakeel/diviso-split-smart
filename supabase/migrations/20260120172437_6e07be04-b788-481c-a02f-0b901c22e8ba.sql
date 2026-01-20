-- Fix type mismatch for email column (varchar to text cast)
DROP FUNCTION IF EXISTS public.get_users_for_admin();

CREATE OR REPLACE FUNCTION public.get_users_for_admin()
RETURNS TABLE(
  id uuid, 
  display_name text, 
  name text, 
  phone text,
  email text,
  created_at timestamp with time zone, 
  is_admin boolean, 
  is_banned boolean, 
  current_plan text, 
  groups_count bigint, 
  expenses_count bigint
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
    p.id,
    p.display_name,
    p.name,
    p.phone,
    au.email::text,
    p.created_at,
    p.is_admin,
    COALESCE(p.is_banned, false) as is_banned,
    get_user_plan(p.id) as current_plan,
    (SELECT COUNT(*) FROM public.group_members gm WHERE gm.user_id = p.id) as groups_count,
    (SELECT COUNT(*) FROM public.expenses e WHERE e.created_by = p.id) as expenses_count
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;