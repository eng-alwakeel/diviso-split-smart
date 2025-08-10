-- Storage policies for private receipts bucket
BEGIN;

-- Allow authenticated users to upload to their own folder (first path segment == auth.uid)
CREATE POLICY "Receipts: users can upload own"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own files
CREATE POLICY "Receipts: users can update own"
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own files
CREATE POLICY "Receipts: users can view own"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Receipts: users can delete own"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

COMMIT;