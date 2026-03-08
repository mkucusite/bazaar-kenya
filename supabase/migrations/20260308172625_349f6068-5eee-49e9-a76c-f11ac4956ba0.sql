
-- SEO settings table for per-page meta overrides
CREATE TABLE public.seo_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_slug TEXT NOT NULL UNIQUE,
  page_name TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  canonical_url TEXT,
  keywords TEXT,
  robots TEXT DEFAULT 'index, follow',
  json_ld JSONB,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read SEO settings (needed by frontend SEOHead)
CREATE POLICY "Anyone can view seo settings" ON public.seo_settings
  FOR SELECT USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage seo settings" ON public.seo_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default pages
INSERT INTO public.seo_settings (page_slug, page_name, meta_title, meta_description) VALUES
  ('/', 'Homepage', 'KenyaAdvert — Buy & Sell on Kenya''s Trusted Classifieds', 'Kenya''s safest classifieds platform. Post free ads, find great deals on electronics, vehicles, property, jobs and more across all 47 counties.'),
  ('/search', 'Search / Browse', 'Browse Ads — Find Deals Across Kenya | KenyaAdvert', 'Search thousands of listings across Kenya. Filter by category, county, price and condition to find exactly what you need.'),
  ('/blog', 'Blog', 'Blog — Tips, Trends & Market Insights | KenyaAdvert', 'Read the latest tips on buying and selling in Kenya, market trends, safety advice and platform updates.'),
  ('/faqs', 'FAQs', 'Frequently Asked Questions | KenyaAdvert', 'Get answers to common questions about posting ads, payments, account management and safety on KenyaAdvert.'),
  ('/login', 'Login', 'Login — Sign In to Your Account | KenyaAdvert', 'Sign in to KenyaAdvert to manage your ads, messages, and favourites.'),
  ('/register', 'Register', 'Register — Create Your Free Account | KenyaAdvert', 'Join KenyaAdvert for free. Post ads, save favourites, and connect with buyers and sellers across Kenya.'),
  ('/post-ad', 'Post Ad', 'Post a Free Ad — Sell Anything in Kenya | KenyaAdvert', 'List your item for free on Kenya''s most trusted classifieds. Reach thousands of buyers across all 47 counties.'),
  ('/safety-tips', 'Safety Tips', 'Safety Tips — Stay Safe While Buying & Selling | KenyaAdvert', 'Essential safety tips for meeting buyers, making payments, and avoiding scams on KenyaAdvert.'),
  ('/about', 'About Us', 'About KenyaAdvert — Kenya''s Trusted Classifieds', 'Learn about KenyaAdvert, our mission to make buying and selling safe and easy for every Kenyan.'),
  ('/terms', 'Terms of Service', 'Terms of Service | KenyaAdvert', 'Read the terms and conditions for using the KenyaAdvert platform.'),
  ('/privacy', 'Privacy Policy', 'Privacy Policy | KenyaAdvert', 'Understand how KenyaAdvert collects, uses and protects your personal data.');
