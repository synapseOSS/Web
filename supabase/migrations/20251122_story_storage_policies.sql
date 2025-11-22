-- Add storage policies for story media buckets
DROP POLICY IF EXISTS "Users can upload story media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload story thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their story media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their story thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their story media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their story thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view story media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view story thumbnails" ON storage.objects;

CREATE POLICY "Users can upload story media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'story-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload story thumbnails"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'story-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their story media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'story-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their story thumbnails"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'story-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their story media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'story-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their story thumbnails"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'story-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view story media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'story-media');

CREATE POLICY "Anyone can view story thumbnails"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'story-thumbnails');
