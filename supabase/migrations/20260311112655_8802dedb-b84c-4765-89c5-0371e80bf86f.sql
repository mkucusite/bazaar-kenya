
-- admin_settings table
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin_settings" ON public.admin_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.admin_settings (key, value) VALUES
  ('storage_provider', 'supabase'),
  ('cloudinary_cloud_name', ''),
  ('cloudinary_upload_preset', ''),
  ('r2_account_id', ''),
  ('r2_access_key', ''),
  ('r2_secret_key', ''),
  ('r2_bucket_name', ''),
  ('r2_public_url', ''),
  ('r2_endpoint', ''),
  ('gemini_api_key', ''),
  ('ai_listings_enabled', 'true'),
  ('ai_default_category', 'Electronics'),
  ('ai_listings_per_batch', '5')
ON CONFLICT (key) DO NOTHING;

-- Add ai_generated column to ads table
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE;

-- Create listing-images storage bucket (for CDN system)
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true) ON CONFLICT (id) DO NOTHING;

-- Allow public read on listing-images
CREATE POLICY "Public read listing-images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'listing-images');
CREATE POLICY "Auth upload listing-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'listing-images');
CREATE POLICY "Auth update listing-images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'listing-images');
CREATE POLICY "Auth delete listing-images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'listing-images');
