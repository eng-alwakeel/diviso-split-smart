-- Make avatars bucket public so getPublicUrl() works
UPDATE storage.buckets 
SET public = true 
WHERE name = 'avatars';

-- Ensure public read access policy exists
CREATE POLICY "Anyone can view avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');