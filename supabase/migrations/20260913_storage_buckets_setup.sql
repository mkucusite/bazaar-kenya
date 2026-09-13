-- Ensure storage buckets exist and are public for media delivery
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('ad-images', 'ad-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('blog-images', 'blog-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('banners', 'banners', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('events', 'events', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('listing-images', 'listing-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read access policies for all media buckets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public read media objects'
  ) THEN
    CREATE POLICY "Public read media objects" ON storage.objects
      FOR SELECT
      USING (bucket_id IN ('ad-images', 'blog-images', 'banners', 'events', 'listing-images'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated upload media objects'
  ) THEN
    CREATE POLICY "Authenticated upload media objects" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id IN ('ad-images', 'blog-images', 'banners', 'events', 'listing-images'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated update media objects'
  ) THEN
    CREATE POLICY "Authenticated update media objects" ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = owner);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated delete media objects'
  ) THEN
    CREATE POLICY "Authenticated delete media objects" ON storage.objects
      FOR DELETE
      TO authenticated
      USING (auth.uid() = owner);
  END IF;
END $$;
