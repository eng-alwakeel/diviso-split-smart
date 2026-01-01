-- Fix is_admin_user() function to support new RBAC roles and proper search_path
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('owner', 'admin', 'finance_admin', 'growth_admin', 'ads_admin', 'developer')
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  )
$$;

-- Fix admin_delete_group function with proper search_path
CREATE OR REPLACE FUNCTION public.admin_delete_group(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  -- Delete related data first
  DELETE FROM public.expense_budget_links WHERE expense_id IN (
    SELECT id FROM public.expenses WHERE group_id = p_group_id
  );
  
  DELETE FROM public.expense_category_links WHERE expense_id IN (
    SELECT id FROM public.expenses WHERE group_id = p_group_id
  );
  
  DELETE FROM public.expense_receipts WHERE expense_id IN (
    SELECT id FROM public.expenses WHERE group_id = p_group_id
  );
  
  DELETE FROM public.expense_approvals WHERE expense_id IN (
    SELECT id FROM public.expenses WHERE group_id = p_group_id
  );
  
  DELETE FROM public.expense_rejections WHERE expense_id IN (
    SELECT id FROM public.expenses WHERE group_id = p_group_id
  );
  
  DELETE FROM public.expense_splits WHERE expense_id IN (
    SELECT id FROM public.expenses WHERE group_id = p_group_id
  );
  
  DELETE FROM public.expenses WHERE group_id = p_group_id;
  DELETE FROM public.budget_categories WHERE budget_id IN (
    SELECT id FROM public.budgets WHERE group_id = p_group_id
  );
  DELETE FROM public.budgets WHERE group_id = p_group_id;
  DELETE FROM public.messages WHERE group_id = p_group_id;
  DELETE FROM public.invites WHERE group_id = p_group_id;
  DELETE FROM public.group_join_tokens WHERE group_id = p_group_id;
  DELETE FROM public.group_members WHERE group_id = p_group_id;
  DELETE FROM public.groups WHERE id = p_group_id;

  RETURN true;
END;
$$;

-- Fix archive_group function
CREATE OR REPLACE FUNCTION public.archive_group(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  UPDATE public.groups 
  SET archived_at = now(), updated_at = now()
  WHERE id = p_group_id;

  RETURN true;
END;
$$;

-- Fix unarchive_group function
CREATE OR REPLACE FUNCTION public.unarchive_group(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  UPDATE public.groups 
  SET archived_at = NULL, updated_at = now()
  WHERE id = p_group_id;

  RETURN true;
END;
$$;