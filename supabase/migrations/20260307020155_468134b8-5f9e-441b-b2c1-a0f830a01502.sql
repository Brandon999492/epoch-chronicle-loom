-- Make avatars bucket private
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Allow authenticated users to read their own avatars
CREATE POLICY "Users can view their own avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
