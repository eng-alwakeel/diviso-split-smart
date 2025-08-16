-- إضافة صلاحية الموافقة على المصاريف للأعضاء العاديين
ALTER TABLE public.group_members 
ADD COLUMN can_approve_expenses BOOLEAN NOT NULL DEFAULT false;

-- تحديث سياسات RLS للسماح للأعضاء المخولين بالموافقة على المصاريف
CREATE POLICY "Members with approval permission can approve expenses"
ON public.expense_approvals
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.expenses e
    JOIN public.group_members gm ON gm.group_id = e.group_id
    WHERE e.id = expense_approvals.expense_id 
      AND gm.user_id = auth.uid()
      AND (gm.role IN ('admin', 'owner') OR gm.can_approve_expenses = true)
  )
  AND approved_by = auth.uid()
);

-- تحديث دالة التحقق من صلاحية الإدارة لتشمل صلاحية الموافقة
CREATE OR REPLACE FUNCTION public.can_approve_group_expenses(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = p_group_id 
      AND gm.user_id = auth.uid() 
      AND (gm.role IN ('admin','owner') OR gm.can_approve_expenses = true)
  ) INTO result;
  RETURN result;
END;
$function$