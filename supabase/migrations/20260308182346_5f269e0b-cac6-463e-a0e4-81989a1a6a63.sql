
CREATE TABLE public.site_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read config
CREATE POLICY "Anyone can read site_config" ON public.site_config FOR SELECT USING (true);

-- Only admins can update
CREATE POLICY "Admins can manage site_config" ON public.site_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Insert default pricing
INSERT INTO public.site_config (key, value) VALUES
  ('silver_price', '299'),
  ('gold_price', '599'),
  ('boost_silver_price', '299'),
  ('boost_gold_price', '599');
