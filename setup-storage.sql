-- Create storage buckets for story feature
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('story-media', 'story-media', true),
  ('story-thumbnails', 'story-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for story-media bucket
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'story-media');

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'story-media' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'story-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'story-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Set up RLS policies for story-thumbnails bucket
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'story-thumbnails');

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'story-thumbnails' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'story-thumbnails' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'story-thumbnails' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
