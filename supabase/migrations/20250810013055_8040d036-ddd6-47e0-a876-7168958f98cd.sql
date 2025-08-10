-- Create table to link expenses to receipt files
CREATE TABLE IF NOT EXISTS public.expense_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL,
  storage_path text NOT NULL,
  uploaded_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_receipts ENABLE ROW LEVEL SECURITY;

-- Policies for expense_receipts
CREATE POLICY "Members can read expense receipts of their groups"
ON public.expense_receipts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.expenses e
    WHERE e.id = expense_receipts.expense_id AND is_group_member(e.group_id)
  )
);

CREATE POLICY "Members can insert expense receipts in their groups"
ON public.expense_receipts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.expenses e
    WHERE e.id = expense_receipts.expense_id AND is_group_member(e.group_id)
  ) AND uploaded_by = auth.uid()
);

CREATE POLICY "Uploader or admins can delete expense receipts"
ON public.expense_receipts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.expenses e
    WHERE e.id = expense_receipts.expense_id AND (uploaded_by = auth.uid() OR is_group_admin(e.group_id))
  )
);

-- Storage policies for receipts bucket
DO $$ BEGIN
  -- Ensure bucket exists (no-op if already exists)
  INSERT INTO storage.buckets (id, name, public) VALUES ('receipts','receipts', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Allow users to upload files into a folder named by their user id
CREATE POLICY IF NOT EXISTS "Users can upload own receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow group members to read receipts linked to their group's expenses
CREATE POLICY IF NOT EXISTS "Group members can read linked receipts"
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

-- Allow uploader or group admins to delete
CREATE POLICY IF NOT EXISTS "Uploader or admins can delete receipts"
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
