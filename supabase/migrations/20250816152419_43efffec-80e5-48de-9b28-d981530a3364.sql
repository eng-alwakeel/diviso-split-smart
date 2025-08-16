-- Check and ensure RLS policies allow editing pending expenses
-- This policy should already exist but let's verify it covers all cases

-- Drop and recreate the policy for users updating their own pending expenses
DROP POLICY IF EXISTS "Users can update their own pending expenses" ON public.expenses;

CREATE POLICY "Users can update their own pending expenses" 
ON public.expenses 
FOR UPDATE 
USING (
  (created_by = auth.uid() OR payer_id = auth.uid()) 
  AND status = 'pending'::expense_status
)
WITH CHECK (
  (created_by = auth.uid() OR payer_id = auth.uid()) 
  AND status = 'pending'::expense_status
);

-- Also ensure users can update their own rejected expenses  
DROP POLICY IF EXISTS "Users can update their own rejected expenses" ON public.expenses;

CREATE POLICY "Users can update their own rejected expenses" 
ON public.expenses 
FOR UPDATE 
USING (
  (created_by = auth.uid() OR payer_id = auth.uid()) 
  AND status = 'rejected'::expense_status
);

-- Allow expense creators to update expense splits for their own expenses
DROP POLICY IF EXISTS "Creators can modify splits for their expenses" ON public.expense_splits;

CREATE POLICY "Creators can modify splits for their expenses" 
ON public.expense_splits 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.expenses e 
    WHERE e.id = expense_splits.expense_id 
    AND (e.created_by = auth.uid() OR e.payer_id = auth.uid())
    AND e.status IN ('pending', 'rejected')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.expenses e 
    WHERE e.id = expense_splits.expense_id 
    AND (e.created_by = auth.uid() OR e.payer_id = auth.uid())
    AND e.status IN ('pending', 'rejected')
  )
);