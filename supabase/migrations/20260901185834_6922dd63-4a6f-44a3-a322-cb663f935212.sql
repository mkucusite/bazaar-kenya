CREATE TABLE IF NOT EXISTS public.directory_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL,
  slug text NOT NULL UNIQUE,
  user_id uuid,
  name text NOT NULL,
  headline text,
  description text,
  meta_description text,
  seo_title text,
  organisation text,
  county text,
  town text,
  location_name text,
  map_url text,
  phone text,
  whatsapp text,
  email text,
  website text,
  price numeric,
  price_label text,
  images text[] NOT NULL DEFAULT '{}',
  avatar_url text,
  tags text[] NOT NULL DEFAULT '{}',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  is_manual boolean NOT NULL DEFAULT false,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS directory_profiles_kind_idx ON public.directory_profiles (kind, is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS directory_profiles_county_idx ON public.directory_profiles (county);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.directory_profiles TO authenticated;
GRANT SELECT, INSERT ON public.directory_profiles TO anon;
GRANT ALL ON public.directory_profiles TO service_role;

ALTER TABLE public.directory_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published directory listings are public"
  ON public.directory_profiles FOR SELECT
  USING (is_published = true OR (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can publish a directory listing"
  ON public.directory_profiles FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Owners can update their listing"
  ON public.directory_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can delete their listing"
  ON public.directory_profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER directory_profiles_updated_at
  BEFORE UPDATE ON public.directory_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS product_id uuid;
CREATE INDEX IF NOT EXISTS payments_product_idx ON public.payments (product_id, payment_status);