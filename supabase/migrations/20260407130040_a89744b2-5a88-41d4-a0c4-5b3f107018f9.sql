-- Fix 1: Allow users to read their own draft entries
CREATE POLICY "Users can view their own drafts"
ON public.draft_entries
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Fix 2: Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);