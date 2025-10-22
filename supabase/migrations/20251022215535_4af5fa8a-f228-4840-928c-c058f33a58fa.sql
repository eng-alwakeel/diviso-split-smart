-- Security Fix: Make avatars bucket private and require authentication
-- This prevents unauthorized enumeration and access to user avatar images

-- Update avatars bucket to be private instead of public
UPDATE storage.buckets 
SET public = false 
WHERE id = 'avatars';

-- Drop the old public access policy
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Create new authenticated read policy - any authenticated user can view avatars
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- Keep existing upload policy (users can upload their own avatars)
-- This policy should already exist, but we ensure it's properly defined
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Keep existing update policy (users can update their own avatars)
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Keep existing delete policy (users can delete their own avatars)
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);