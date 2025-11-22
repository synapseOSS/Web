-- Create storage buckets for story feature
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('story-media', 'story-media', true),
  ('story-thumbnails', 'story-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read story-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload story-media" ON storage.objects;
DROP POLICY IF EXISTS "Public read story-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload story-thumbnails" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- story-media bucket policies
CREATE POLICY "Public read story-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'story-media');

CREATE POLICY "Authenticated upload story-media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'story-media' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Delete own story-media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'story-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- story-thumbnails bucket policies
CREATE POLICY "Public read story-thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'story-thumbnails');

CREATE POLICY "Authenticated upload story-thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'story-thumbnails' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Delete own story-thumbnails" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'story-thumbnails' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
