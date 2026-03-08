
-- Storage bucket for banner images
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload banners
CREATE POLICY "Authenticated users can upload banners"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Anyone can view banners"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'banners');

CREATE POLICY "Users can delete own banners"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Banner campaigns table
CREATE TABLE public.banner_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_type text NOT NULL DEFAULT 'basic_banner',
  banner_image text NOT NULL,
  target_url text NOT NULL,
  business_name text NOT NULL,
  position text NOT NULL DEFAULT 'homepage_top',
  status text NOT NULL DEFAULT 'pending_payment',
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  payment_id uuid REFERENCES public.payments(id),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banner_campaigns ENABLE ROW LEVEL SECURITY;

-- Users can manage own campaigns
CREATE POLICY "Users can view own campaigns"
  ON public.banner_campaigns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns"
  ON public.banner_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
  ON public.banner_campaigns FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage all campaigns"
  ON public.banner_campaigns FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public can view active campaigns (for display)
CREATE POLICY "Anyone can view active campaigns"
  ON public.banner_campaigns FOR SELECT
  TO anon, authenticated
  USING (status = 'active');
