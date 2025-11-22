-- Create storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow public read access
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- Allow users to update their own uploads
CREATE POLICY "Users can update own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = owner);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = owner);
