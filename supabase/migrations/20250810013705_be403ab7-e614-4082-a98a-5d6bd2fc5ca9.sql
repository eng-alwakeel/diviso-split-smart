-- Fix previous attempt: create table and policies, dropping if exist first

-- Table for expense receipts
CREATE TABLE IF NOT EXISTS public.expense_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL,
  storage_path text NOT NULL,
  uploaded_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_receipts ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies on expense_receipts
DROP POLICY IF EXISTS "Members can read expense receipts of their groups" ON public.expense_receipts;
CREATE POLICY "Members can read expense receipts of their groups"
ON public.expense_receipts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.expenses e
    WHERE e.id = expense_receipts.expense_id AND is_group_member(e.group_id)
  )
);

DROP POLICY IF EXISTS "Members can insert expense receipts in their groups" ON public.expense_receipts;
CREATE POLICY "Members can insert expense receipts in their groups"
ON public.expense_receipts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.expenses e
    WHERE e.id = expense_receipts.expense_id AND is_group_member(e.group_id)
  ) AND uploaded_by = auth.uid()
);

DROP POLICY IF EXISTS "Uploader or admins can delete expense receipts" ON public.expense_receipts;
CREATE POLICY "Uploader or admins can delete expense receipts"
ON public.expense_receipts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.expenses e
    WHERE e.id = expense_receipts.expense_id AND (uploaded_by = auth.uid() OR is_group_admin(e.group_id))
  )
);

-- Ensure receipts bucket exists (no-op if already exists)
DO $$ BEGIN
  INSERT INTO storage.buckets (id, name, public) VALUES ('receipts','receipts', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Storage policies: drop then create
DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;
CREATE POLICY "Users can upload own receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Group members can read linked receipts" ON storage.objects;
CREATE POLICY "Group members can read linked receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' AND EXISTS (
    SELECT 1 FROM public.expense_receipts er
    JOIN public.expenses e ON e.id = er.expense_id
    WHERE er.storage_path = storage.objects.name AND is_group_member(e.group_id)
  )
);

DROP POLICY IF EXISTS "Uploader or admins can delete receipts" ON storage.objects;
CREATE POLICY "Uploader or admins can delete receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts' AND EXISTS (
    SELECT 1 FROM public.expense_receipts er
    JOIN public.expenses e ON e.id = er.expense_id
    WHERE er.storage_path = storage.objects.name AND (er.uploaded_by = auth.uid() OR is_group_admin(e.group_id))
  )
);
