-- Final admin function for group deletion
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