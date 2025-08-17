-- Admin management functions
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