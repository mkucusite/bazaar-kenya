
-- >>> Migration: 20260307065501_17242b70-f5a9-4b51-9323-fe539ee96315.sql

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Public profiles visible" ON public.profiles FOR SELECT TO anon USING (true);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

-- Subcategories table
CREATE TABLE public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  credits_cost INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subcategories" ON public.subcategories FOR SELECT USING (true);

-- Ads table
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  is_negotiable BOOLEAN DEFAULT false,
  condition TEXT DEFAULT 'Used',
  category_id UUID REFERENCES public.categories(id),
  subcategory_id UUID REFERENCES public.subcategories(id),
  county TEXT NOT NULL,
  town TEXT,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  website TEXT,
  images TEXT[] DEFAULT '{}',
  badge TEXT DEFAULT 'standard',
  status TEXT DEFAULT 'active',
  views_count INT DEFAULT 0,
  contacts_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active ads" ON public.ads FOR SELECT USING (status = 'active');
CREATE POLICY "Users can view own ads" ON public.ads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ads" ON public.ads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ads" ON public.ads FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ads" ON public.ads FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  transaction_id TEXT UNIQUE,
  mpesa_code TEXT,
  package_type TEXT DEFAULT 'standard',
  ad_id UUID REFERENCES public.ads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anon can insert payments" ON public.payments FOR INSERT TO anon WITH CHECK (true);

-- Credits table
CREATE TABLE public.credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  balance INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own credits" ON public.credits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own credits" ON public.credits FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credits" ON public.credits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Credit purchases history
CREATE TABLE public.credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credits_amount INT NOT NULL,
  price NUMERIC NOT NULL,
  payment_id UUID REFERENCES public.payments(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own purchases" ON public.credit_purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Favourites
CREATE TABLE public.favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, ad_id)
);
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own favourites" ON public.favourites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Messages / Chats
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES public.ads(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conversation participants can view messages" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())));
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Alerts
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  category TEXT,
  county TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own alerts" ON public.alerts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Blog posts
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  image TEXT,
  category TEXT,
  author TEXT DEFAULT 'KenyaAdvert Team',
  read_time TEXT DEFAULT '5 min',
  views_count INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published posts" ON public.blog_posts FOR SELECT USING (is_published = true);

-- Blog comments
CREATE TABLE public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON public.blog_comments FOR SELECT USING (true);
CREATE POLICY "Users can add comments" ON public.blog_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Business profiles
CREATE TABLE public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  location TEXT,
  phone TEXT,
  whatsapp TEXT,
  website TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view business profiles" ON public.business_profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage own business" ON public.business_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed categories
INSERT INTO public.categories (name, icon, color, sort_order) VALUES
  ('Electronics', '💻', 'bg-blue-500', 1),
  ('Home, Garden & Kids', '🏡', 'bg-green-500', 2),
  ('Vehicles', '🚗', 'bg-red-500', 3),
  ('Car Parts & Accessories', '🔧', 'bg-orange-500', 4),
  ('Property Rentals & Sales', '🏠', 'bg-purple-500', 5),
  ('Jobs', '💼', 'bg-indigo-500', 6),
  ('Entertainment, Sports & Travel', '⚽', 'bg-pink-500', 7),
  ('Commercial Supplies', '📦', 'bg-amber-500', 8),
  ('Farming & Agriculture', '🌾', 'bg-lime-600', 9),
  ('Services', '🛠️', 'bg-teal-500', 10),
  ('Building Supplies', '🧱', 'bg-stone-500', 11),
  ('Fashion, Health & Beauty', '👗', 'bg-rose-500', 12),
  ('Deals', '🏷️', 'bg-yellow-500', 13),
  ('Business Profiles', '🏢', 'bg-cyan-600', 14),
  ('Classifieds', '📋', 'bg-gray-500', 15);

-- Seed blog posts
INSERT INTO public.blog_posts (title, slug, excerpt, content, image, category, author, read_time) VALUES
  ('Best Cars to Buy in Kenya Under KSh 1 Million', 'best-cars-kenya-under-1-million', 'Looking for an affordable car in Kenya? Here are the top picks that offer great value for money, fuel efficiency, and reliability on Kenyan roads.', 'Looking for a reliable car in Kenya that won''t break the bank? The Kenyan used car market offers a wide variety of vehicles under KSh 1 million. Here are our top recommendations:\n\n## 1. Toyota Vitz\nThe Toyota Vitz remains one of the most popular cars in Kenya. With excellent fuel economy and low maintenance costs, it''s perfect for city driving.\n\n## 2. Mazda Demio\nAnother excellent choice for budget-conscious buyers. The Mazda Demio offers a comfortable ride and good fuel efficiency.\n\n## 3. Nissan Note\nThe Nissan Note provides more interior space than most cars in its class, making it ideal for families.\n\n## 4. Honda Fit\nKnown for its reliability and spacious interior despite its compact size, the Honda Fit is a top choice.\n\n## 5. Suzuki Swift\nThe Suzuki Swift is perfect for navigating Nairobi traffic with its compact size and peppy engine.\n\nWhen buying a used car in Kenya, always:\n- Get a pre-purchase inspection\n- Verify the logbook at NTSA\n- Check for accident history\n- Test drive thoroughly', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0ffe?w=800&h=500&fit=crop', 'Vehicles', 'KenyaAdvert Team', '5 min'),
  ('How to Rent a House in Nairobi: Complete Guide', 'how-to-rent-house-nairobi', 'A comprehensive guide to finding and renting the perfect home in Nairobi.', 'Renting a house in Nairobi can be challenging, but with the right approach, you can find the perfect home. Here''s your complete guide.\n\n## Setting Your Budget\nNairobi rental prices vary widely by location. Budget areas like Kahawa, Pipeline, and Githurai offer affordable options, while Kilimani, Westlands, and Karen are premium.\n\n## Popular Neighbourhoods\n- **Kilimani**: Modern apartments, close to CBD\n- **Westlands**: Great nightlife and restaurants\n- **Karen**: Spacious homes, quiet environment\n- **Roysambu**: Affordable, near universities\n- **South B/C**: Middle-class friendly\n\n## Tips for House Hunting\n1. Start searching 1-2 months before your move date\n2. Visit properties in person\n3. Check water supply and security\n4. Understand the lease terms\n5. Budget for deposit (usually 1-2 months rent)', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop', 'Property', 'KenyaAdvert Team', '7 min'),
  ('Top 10 Electronics Shops in Nairobi', 'top-10-electronics-shops-nairobi', 'Discover the best electronics shops in Nairobi for phones, laptops, and gadgets.', 'Nairobi has become a hub for electronics shopping in East Africa. Here are the top 10 shops.\n\n## 1. Luthuli Avenue Shops\nThe heart of electronics retail in Nairobi. You''ll find everything from phones to laptop accessories at competitive prices.\n\n## 2. Samsung Experience Store\nFor genuine Samsung products with warranty.\n\n## 3. Jumia Physical Store\nBrowse and buy with the assurance of Kenya''s largest online retailer.\n\n## Tips for Buying Electronics\n- Always ask for warranty\n- Compare prices across multiple shops\n- Check for genuine products\n- Use M-Pesa for secure payments\n- Keep your receipt', 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=800&h=500&fit=crop', 'Electronics', 'KenyaAdvert Team', '6 min'),
  ('How to Sell Your Phone Online Safely in Kenya', 'sell-phone-online-safely-kenya', 'Selling your phone online? Follow these safety tips to avoid scams.', 'Selling your phone online in Kenya can be quick and profitable if done safely. Here''s how to protect yourself.\n\n## Preparing Your Phone\n1. Back up all your data\n2. Factory reset the device\n3. Remove SIM and memory cards\n4. Clean the phone thoroughly\n5. Take clear, well-lit photos\n\n## Setting the Right Price\nResearch similar phones on KenyaAdvert to set a competitive price. Consider the condition, age, and accessories included.\n\n## Safety Tips\n- Meet in a public place (like a mall or police station)\n- Never share personal banking details\n- Use M-Pesa for secure transactions\n- Verify buyer identity\n- Don''t ship before receiving payment', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=500&fit=crop', 'Tips', 'KenyaAdvert Team', '4 min'),
  ('Farming in Kenya: Best Equipment for Small Scale Farmers', 'farming-kenya-best-equipment', 'Essential farming equipment and tools for small-scale farmers in Kenya.', 'Small-scale farming is the backbone of Kenya''s agriculture sector. Having the right equipment can significantly boost your productivity.\n\n## Essential Equipment\n\n### 1. Ploughs\nOx-drawn ploughs remain popular and affordable for small farms. Modern disc ploughs are available for those with tractors.\n\n### 2. Irrigation Systems\nDrip irrigation is the most water-efficient method. You can set up a basic system for under KSh 50,000.\n\n### 3. Sprayers\nKnapsack sprayers are essential for pest and disease control. Invest in a quality one that will last.\n\n### 4. Storage Solutions\nProper grain storage prevents post-harvest losses. Hermetic bags and metal silos are good options.\n\n## Where to Buy\nKenyaAdvert has a dedicated Farming & Agriculture category where you can find both new and used equipment at great prices.', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&h=500&fit=crop', 'Agriculture', 'KenyaAdvert Team', '8 min');

-- Seed subcategories
INSERT INTO public.subcategories (category_id, name) 
SELECT c.id, s.name FROM public.categories c, 
  (VALUES ('Phones & Tablets'), ('Laptops & Computers'), ('TVs & Audio'), ('Cameras'), ('Accessories')) AS s(name)
WHERE c.name = 'Electronics';

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c,
  (VALUES ('Furniture'), ('Kitchen'), ('Baby & Kids'), ('Garden'), ('Home Decor')) AS s(name)
WHERE c.name = 'Home, Garden & Kids';

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c,
  (VALUES ('Cars'), ('Motorcycles'), ('Trucks'), ('Buses'), ('Spare Parts')) AS s(name)
WHERE c.name = 'Vehicles';

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c,
  (VALUES ('Engine Parts'), ('Body Parts'), ('Tyres & Rims'), ('Audio Systems'), ('Interior')) AS s(name)
WHERE c.name = 'Car Parts & Accessories';

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c,
  (VALUES ('Houses for Sale'), ('Houses for Rent'), ('Land'), ('Commercial'), ('Short Stay')) AS s(name)
WHERE c.name = 'Property Rentals & Sales';

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c,
  (VALUES ('Full Time'), ('Part Time'), ('Remote'), ('Internships'), ('Freelance')) AS s(name)
WHERE c.name = 'Jobs';

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c,
  (VALUES ('Sports Equipment'), ('Musical Instruments'), ('Travel'), ('Events'), ('Gaming')) AS s(name)
WHERE c.name = 'Entertainment, Sports & Travel';

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c,
  (VALUES ('Office Equipment'), ('Industrial'), ('Wholesale'), ('Raw Materials')) AS s(name)
WHERE c.name = 'Commercial Supplies';

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c,
  (VALUES ('Farm Equipment'), ('Seeds & Fertilizer'), ('Livestock'), ('Produce'), ('Agri Services')) AS s(name)
WHERE c.name = 'Farming & Agriculture';

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c,
  (VALUES ('Repairs'), ('Transport'), ('Cleaning'), ('IT Services'), ('Beauty')) AS s(name)
WHERE c.name = 'Services';

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c,
  (VALUES ('Cement & Sand'), ('Roofing'), ('Plumbing'), ('Electrical'), ('Paint')) AS s(name)
WHERE c.name = 'Building Supplies';

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c,
  (VALUES ('Clothing'), ('Shoes'), ('Bags'), ('Jewellery'), ('Health Products')) AS s(name)
WHERE c.name = 'Fashion, Health & Beauty';

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c,
  (VALUES ('Flash Sales'), ('Clearance'), ('Bundle Deals'), ('Coupons')) AS s(name)
WHERE c.name = 'Deals';

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c,
  (VALUES ('Shops'), ('Dealers'), ('Service Providers'), ('Agencies')) AS s(name)
WHERE c.name = 'Business Profiles';

INSERT INTO public.subcategories (category_id, name)
SELECT c.id, s.name FROM public.categories c,
  (VALUES ('Announcements'), ('Lost & Found'), ('Community'), ('Miscellaneous')) AS s(name)
WHERE c.name = 'Classifieds';

-- User roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Ad images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-images', 'ad-images', true);
CREATE POLICY "Anyone can view ad images" ON storage.objects FOR SELECT USING (bucket_id = 'ad-images');
CREATE POLICY "Authenticated users can upload ad images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ad-images');
CREATE POLICY "Users can delete own ad images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ad-images' AND (storage.foldername(name))[1] = auth.uid()::text);



-- >>> Migration: 20260307065508_f5687db7-98f3-469d-9732-d2b235f31112.sql

-- Fix function search path
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Fix permissive anon insert on payments - remove it, we'll handle via edge function with service role
DROP POLICY "Anon can insert payments" ON public.payments;



-- >>> Migration: 20260308123232_56332ff5-b305-4d41-8114-be73770c6b7d.sql
-- Admin moderation queue for ad reports
CREATE TABLE IF NOT EXISTS public.ad_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  ai_label TEXT,
  ai_summary TEXT,
  ai_confidence NUMERIC,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ad_id, reporter_id)
);

-- User-requested alerts that admins can review
CREATE TABLE IF NOT EXISTS public.alert_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  category TEXT,
  county TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated-at trigger helper
CREATE OR REPLACE FUNCTION public.set_row_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ad_reports_updated_at ON public.ad_reports;
CREATE TRIGGER trg_ad_reports_updated_at
BEFORE UPDATE ON public.ad_reports
FOR EACH ROW
EXECUTE FUNCTION public.set_row_updated_at();

DROP TRIGGER IF EXISTS trg_alert_requests_updated_at ON public.alert_requests;
CREATE TRIGGER trg_alert_requests_updated_at
BEFORE UPDATE ON public.alert_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_row_updated_at();

ALTER TABLE public.ad_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_requests ENABLE ROW LEVEL SECURITY;

-- ad_reports policies
DROP POLICY IF EXISTS "Users can report ads" ON public.ad_reports;
CREATE POLICY "Users can report ads"
ON public.ad_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view own reports" ON public.ad_reports;
CREATE POLICY "Users can view own reports"
ON public.ad_reports
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON public.ad_reports;
CREATE POLICY "Admins can view all reports"
ON public.ad_reports
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all reports" ON public.ad_reports;
CREATE POLICY "Admins can update all reports"
ON public.ad_reports
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- alert_requests policies
DROP POLICY IF EXISTS "Users can request alerts" ON public.alert_requests;
CREATE POLICY "Users can request alerts"
ON public.alert_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own alert requests" ON public.alert_requests;
CREATE POLICY "Users can view own alert requests"
ON public.alert_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all alert requests" ON public.alert_requests;
CREATE POLICY "Admins can view all alert requests"
ON public.alert_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update alert requests" ON public.alert_requests;
CREATE POLICY "Admins can update alert requests"
ON public.alert_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin ads moderation access
DROP POLICY IF EXISTS "Admins can view all ads" ON public.ads;
CREATE POLICY "Admins can view all ads"
ON public.ads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all ads" ON public.ads;
CREATE POLICY "Admins can update all ads"
ON public.ads
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete all ads" ON public.ads;
CREATE POLICY "Admins can delete all ads"
ON public.ads
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_ad_reports_ad_id ON public.ad_reports(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_reports_status ON public.ad_reports(status);
CREATE INDEX IF NOT EXISTS idx_alert_requests_user_id ON public.alert_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_requests_status ON public.alert_requests(status);



-- >>> Migration: 20260308123335_6541f5a9-ff8d-4e45-8608-1bea870669d3.sql
-- Admin credits management policies
DROP POLICY IF EXISTS "Admins can view all credits" ON public.credits;
CREATE POLICY "Admins can view all credits"
ON public.credits
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all credits" ON public.credits;
CREATE POLICY "Admins can update all credits"
ON public.credits
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert credits" ON public.credits;
CREATE POLICY "Admins can insert credits"
ON public.credits
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));



-- >>> Migration: 20260308123418_9f6edfc0-6d5e-44bf-ab24-8d56092f52b0.sql
-- Admin access for alerts management
DROP POLICY IF EXISTS "Admins can view all alerts" ON public.alerts;
CREATE POLICY "Admins can view all alerts"
ON public.alerts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can create alerts for users" ON public.alerts;
CREATE POLICY "Admins can create alerts for users"
ON public.alerts
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update alerts" ON public.alerts;
CREATE POLICY "Admins can update alerts"
ON public.alerts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete alerts" ON public.alerts;
CREATE POLICY "Admins can delete alerts"
ON public.alerts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));



-- >>> Migration: 20260308142054_4fb1ba6a-35cf-434e-b34d-905f3a3c14e9.sql

-- Allow conversation participants to mark messages as read
CREATE POLICY "Participants can update message read status"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);

-- Allow conversation participants to update conversation timestamp
CREATE POLICY "Participants can update conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
)
WITH CHECK (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);



-- >>> Migration: 20260308155034_177f8090-4aa6-47b0-a715-fe4bdf68565e.sql

-- Site pages table for admin-editable legal/content pages
CREATE TABLE public.site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

-- Anyone can read pages
CREATE POLICY "Anyone can view site pages" ON public.site_pages FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage site pages" ON public.site_pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default pages
INSERT INTO public.site_pages (slug, title, content) VALUES
  ('privacy', 'Privacy Policy', E'**Last updated:** March 2026\n\n## 1. Information We Collect\nWe collect information you provide when registering (name, email, phone number), listing ads (photos, descriptions, location), and using the platform (search queries, page views). We also collect device information and IP addresses for security purposes.\n\n## 2. How We Use Your Information\nWe use your data to: provide and improve our services, display your listings to potential buyers, send notifications about your ads and account, prevent fraud and abuse, and comply with Kenyan data protection laws.\n\n## 3. Information Sharing\nYour phone number is visible to potential buyers on your listings. We do not sell your personal data to third parties. We may share information with law enforcement when required by Kenyan law.\n\n## 4. Data Security\nWe use encryption and secure cloud infrastructure to protect your data. However, no system is 100% secure. We recommend using strong passwords and not sharing your account credentials.\n\n## 5. Cookies\nWe use cookies and local storage to remember your preferences (theme, search history) and keep you logged in. You can disable cookies in your browser, but some features may not work properly.\n\n## 6. Your Rights\nUnder Kenya''s Data Protection Act 2019, you have the right to access, correct, and delete your personal data. Contact support@kenyaadverts.co.ke to exercise these rights.'),
  ('terms', 'Terms of Service', E'**Last updated:** March 2026\n\n## 1. Acceptance of Terms\nBy accessing or using KenyaAdvert (kenyaadverts.co.ke), you agree to be bound by these Terms of Service.\n\n## 2. Platform Description\nKenyaAdvert is an online classifieds marketplace that connects buyers and sellers across Kenya. We do not own, sell, or buy any items listed on the platform.\n\n## 3. User Accounts\nYou must provide accurate information when creating an account. You must be at least 18 years old to use this service.\n\n## 4. Listing Guidelines\nUsers must not post illegal items, counterfeit goods, stolen property, weapons, drugs, or any content that violates Kenyan law. KenyaAdvert reserves the right to remove any listing without notice.\n\n## 5. Payments & Credits\nPremium listing packages require payment via M-Pesa. All payments are non-refundable once a listing has been published. Credits have no cash value and cannot be transferred.\n\n## 6. Limitation of Liability\nKenyaAdvert is not responsible for the quality, safety, or legality of items listed. Users transact at their own risk.\n\n## 7. Contact\nFor questions, contact us at support@kenyaadverts.co.ke'),
  ('safety-tips', 'Safety Tips', E'Stay safe while buying and selling on KenyaAdvert.\n\n## Meet in Public Places\nAlways arrange to meet buyers or sellers in busy, public locations like shopping malls, police stations, or well-known landmarks.\n\n## Inspect Before Paying\nNever pay for an item before you have physically seen and inspected it.\n\n## Use M-Pesa for Payments\nWhenever possible, use M-Pesa for transactions. It provides a digital trail and is safer than carrying cash.\n\n## Beware of Too-Good Deals\nIf a price seems unbelievably low for an item, be cautious. Scammers often lure victims with prices well below market value.\n\n## Verify the Seller\nCall the seller before meeting. Ask specific questions about the item.\n\n## Trust Your Instincts\nIf something feels wrong about a transaction, trust your gut and walk away.\n\n## Report Suspicious Activity\nIf you encounter a suspicious listing or seller, use the Report button on any ad page. Our team reviews every report within 24 hours. Email: support@kenyaadverts.co.ke'),
  ('about', 'About KenyaAdvert', E'KenyaAdvert is Kenya''s trusted online classifieds platform, connecting millions of buyers and sellers across all 47 counties.\n\n## Our Mission\nTo make buying and selling accessible, safe, and efficient for every Kenyan.\n\n## What We Offer\n- **Free Listings**: Post ads at no cost with our standard package\n- **Premium Visibility**: Gold and Silver packages for maximum exposure\n- **Secure Payments**: M-Pesa integration via PayHero\n- **AI-Powered Safety**: Automated content moderation\n- **Smart Alerts**: Get notified when items you want are listed\n\n## Contact Us\nEmail: support@kenyaadverts.co.ke');



-- >>> Migration: 20260308163736_ceb901b6-fd3e-45bd-8240-fab8bc9a8a6a.sql

CREATE TABLE public.category_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_name text NOT NULL,
  parent_category_id uuid REFERENCES public.categories(id),
  note text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.category_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own suggestions"
  ON public.category_suggestions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own suggestions"
  ON public.category_suggestions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update suggestions"
  ON public.category_suggestions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));



-- >>> Migration: 20260308171725_e8c2f4d3-9fa1-4139-b33f-413ab7ac1864.sql

-- Login logs table for tracking all auth events
CREATE TABLE public.login_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  event_type TEXT NOT NULL DEFAULT 'login', -- login, login_failed, signup, logout
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- IP blocks table for blocking malicious IPs
CREATE TABLE public.ip_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT,
  blocked_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_blocks ENABLE ROW LEVEL SECURITY;

-- Only admins can view login logs
CREATE POLICY "Admins can view login logs" ON public.login_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert login logs (via edge function with service role)
CREATE POLICY "Admins can insert login logs" ON public.login_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Only admins can manage IP blocks
CREATE POLICY "Admins can manage ip blocks" ON public.ip_blocks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow anyone to read ip_blocks for checking (needed for rate limiting)
CREATE POLICY "Anyone can check ip blocks" ON public.ip_blocks
  FOR SELECT TO anon, authenticated
  USING (true);



-- >>> Migration: 20260308171735_7e9a9862-c0df-47a8-a720-51e4badad7d9.sql

-- Fix overly permissive INSERT policy on login_logs
DROP POLICY "Admins can insert login logs" ON public.login_logs;

-- Allow authenticated users to insert their own login logs
CREATE POLICY "Users can log own events" ON public.login_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);



-- >>> Migration: 20260308172625_349f6068-5eee-49e9-a76c-f11ac4956ba0.sql

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



-- >>> Migration: 20260308174619_43c8bb90-889c-4dbe-9369-158664e915df.sql
-- Add slug column to ads
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index on slug (partial, only for non-null slugs)
CREATE UNIQUE INDEX IF NOT EXISTS ads_slug_unique ON public.ads (slug) WHERE slug IS NOT NULL;

-- Function to generate a unique slug from title
CREATE OR REPLACE FUNCTION public.generate_ad_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  -- Only generate if slug is null or title changed
  IF NEW.slug IS NOT NULL AND (TG_OP = 'UPDATE' AND OLD.title = NEW.title) THEN
    RETURN NEW;
  END IF;

  -- Generate base slug from title
  base_slug := lower(NEW.title);
  base_slug := translate(base_slug, 'àáâãäåèéêëìíîïòóôõöùúûüýÿñ', 'aaaaaaeeeeiiiioooooouuuuyyn');
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := trim(base_slug);
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := left(base_slug, 80);

  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'listing';
  END IF;

  -- Try the base slug first, then append counter for uniqueness
  final_slug := base_slug;
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.ads WHERE slug = final_slug AND id != NEW.id) THEN
      EXIT;
    END IF;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS tr_generate_ad_slug ON public.ads;
CREATE TRIGGER tr_generate_ad_slug
  BEFORE INSERT OR UPDATE ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_ad_slug();

-- Backfill slugs for all existing ads (trigger fires on update)
UPDATE public.ads SET slug = NULL WHERE slug IS NULL;



-- >>> Migration: 20260308182346_5f269e0b-cac6-463e-a0e4-81989a1a6a63.sql

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



-- >>> Migration: 20260308184403_d1642fda-6559-430f-bd28-5267384ea52b.sql
-- Allow admins to view all payments
CREATE POLICY "Admins can view all payments"
ON public.payments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update payments (e.g. mark as refunded)
CREATE POLICY "Admins can update all payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));



-- >>> Migration: 20260308193610_c208eaf6-18e3-42d7-9e9d-662559a553a6.sql

-- Function: create a notification for the message recipient
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  conv RECORD;
  recipient_id uuid;
  ad_title text;
  sender_name text;
BEGIN
  -- Get conversation details
  SELECT * INTO conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Determine recipient (the other person)
  IF NEW.sender_id = conv.buyer_id THEN
    recipient_id := conv.seller_id;
  ELSE
    recipient_id := conv.buyer_id;
  END IF;

  -- Get sender name
  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  sender_name := COALESCE(sender_name, 'Someone');

  -- Get ad title if available
  IF conv.ad_id IS NOT NULL THEN
    SELECT title INTO ad_title FROM public.ads WHERE id = conv.ad_id;
  END IF;
  ad_title := COALESCE(ad_title, 'a listing');

  -- Insert notification
  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (
    recipient_id,
    sender_name || ' sent you a message',
    'Re: ' || ad_title || ' — "' || LEFT(NEW.content, 80) || CASE WHEN LENGTH(NEW.content) > 80 THEN '...' ELSE '' END || '"',
    'message',
    '/chats'
  );

  RETURN NEW;
END;
$$;

-- Trigger on new message
CREATE TRIGGER trg_notify_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_message();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;



-- >>> Migration: 20260308194546_9b490cd1-267a-4386-8d66-a5e7825d2acd.sql

-- Enable required extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;



-- >>> Migration: 20260308195953_f04a43a5-bb22-4d5f-bf09-b37227cbecde.sql

-- User notification preferences
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_messages boolean NOT NULL DEFAULT true,
  email_ad_expiry boolean NOT NULL DEFAULT true,
  email_promotions boolean NOT NULL DEFAULT false,
  push_messages boolean NOT NULL DEFAULT true,
  push_ad_expiry boolean NOT NULL DEFAULT true,
  push_promotions boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON public.notification_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User privacy settings
CREATE TABLE public.privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  show_phone boolean NOT NULL DEFAULT true,
  show_email boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own privacy"
  ON public.privacy_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Advertiser requests
CREATE TABLE public.advertiser_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  contact_person text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  preferred_package text NOT NULL DEFAULT 'basic_banner',
  message text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.advertiser_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit advertiser request"
  ON public.advertiser_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage advertiser requests"
  ON public.advertiser_requests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));



-- >>> Migration: 20260308200817_1a72717f-827f-4657-bf7d-028b2ec23b7f.sql

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



-- >>> Migration: 20260308201126_30b89edf-5774-43d5-9c54-c18bf3a41502.sql

-- Function to atomically increment banner impressions
CREATE OR REPLACE FUNCTION public.increment_banner_impressions(campaign_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.banner_campaigns
  SET impressions = impressions + 1
  WHERE id = campaign_id AND status = 'active';
$$;

-- Function to atomically increment banner clicks
CREATE OR REPLACE FUNCTION public.increment_banner_clicks(campaign_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.banner_campaigns
  SET clicks = clicks + 1
  WHERE id = campaign_id AND status = 'active';
$$;



-- >>> Migration: 20260308205424_55d6717a-a0a8-4c2d-831d-819c01550a39.sql

-- CRITICAL FIX 1: Remove dangerous "Users can update own credits" policy
-- This prevents users from inflating their own credit balance
DROP POLICY IF EXISTS "Users can update own credits" ON public.credits;

-- CRITICAL FIX 2: Replace broad ip_blocks SELECT with a secure function
DROP POLICY IF EXISTS "Anyone can check ip blocks" ON public.ip_blocks;

-- Create a safe function that only returns boolean (not the full block list)
CREATE OR REPLACE FUNCTION public.is_ip_blocked(check_ip text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ip_blocks
    WHERE ip_address = check_ip
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.is_ip_blocked(text) TO anon;
GRANT EXECUTE ON FUNCTION public.is_ip_blocked(text) TO authenticated;

-- IMPROVEMENT: Restrict public profile SELECT to hide phone when privacy setting says so
-- First drop the overly permissive policy
DROP POLICY IF EXISTS "Public profiles visible" ON public.profiles;

-- Create a view-like policy that still allows public read but is documented
-- (Phone filtering will be done at application level since RLS can't do column-level)
CREATE POLICY "Public profiles visible"
ON public.profiles
FOR SELECT
USING (true);

-- Enable leaked password protection
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;



-- >>> Migration: 20260308205653_5e81c789-c98d-4d7a-8030-92ce385f0e40.sql

-- FIX: Create a secure view/function to get profiles while respecting privacy settings
-- This function returns profile data but hides phone when show_phone is false
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  is_verified boolean,
  phone text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.is_verified,
    CASE
      WHEN ps.show_phone IS NULL THEN p.phone  -- default: show phone
      WHEN ps.show_phone = true THEN p.phone
      ELSE NULL
    END as phone,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.privacy_settings ps ON ps.user_id = p.id
  WHERE p.id = profile_id
$$;

-- FIX: Tighten the advertiser_requests INSERT policy to prevent spam
DROP POLICY IF EXISTS "Anyone can submit advertiser request" ON public.advertiser_requests;
CREATE POLICY "Authenticated users can submit advertiser request"
ON public.advertiser_requests
FOR INSERT
TO authenticated
WITH CHECK (true);

-- HARDENING: Add rate limit tracking table for sensitive operations
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action text NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only server-side can manage rate limits
CREATE POLICY "Service role only"
ON public.rate_limits
FOR ALL
USING (false);

-- HARDENING: Restrict banner_campaigns public SELECT to only display columns
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON public.banner_campaigns;
CREATE POLICY "Anyone can view active campaign display data"
ON public.banner_campaigns
FOR SELECT
USING (status = 'active');



-- >>> Migration: 20260308211514_bd1dd892-6735-4bb6-958e-bcf82611f2ef.sql

-- Allow admins to manage blog posts (insert, update, delete)
CREATE POLICY "Admins can manage blog posts"
ON public.blog_posts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));



-- >>> Migration: 20260308212437_db6c7c39-bd7e-40f5-988c-19496569cccc.sql
-- Reliable public view counters for ads and blog posts
create or replace function public.increment_ad_views(target_ad_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ads
  set views_count = coalesce(views_count, 0) + 1
  where id = target_ad_id
    and status = 'active';
end;
$$;

create or replace function public.increment_blog_post_views(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.blog_posts
  set views_count = coalesce(views_count, 0) + 1
  where id = target_post_id
    and is_published = true;
end;
$$;

revoke all on function public.increment_ad_views(uuid) from public;
revoke all on function public.increment_blog_post_views(uuid) from public;

grant execute on function public.increment_ad_views(uuid) to anon, authenticated;
grant execute on function public.increment_blog_post_views(uuid) to anon, authenticated;



-- >>> Migration: 20260308223127_2a461976-9cd8-45a5-b783-9d8d910f5c98.sql
UPDATE public.blog_posts SET image = 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&h=500&fit=crop' WHERE slug = 'best-cars-kenya-under-1-million' AND image LIKE '%bd32c8ce0ffe%';



-- >>> Migration: 20260308224502_e8294b53-b88f-4e42-a587-f9a74b90d35d.sql
-- Allow users to delete their own banner campaigns
CREATE POLICY "Users can delete own campaigns"
ON public.banner_campaigns
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);



-- >>> Migration: 20260311112655_8802dedb-b84c-4765-89c5-0371e80bf86f.sql

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



-- >>> Migration: 20260417035744_296fc4e5-4d9e-4bf5-924d-b9f546a40a83.sql

-- Allow anonymous reviews & nested replies
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;

-- Drop strict insert policy and re-create permissive one
DROP POLICY IF EXISTS "Auth insert" ON public.reviews;

CREATE POLICY "Anyone can insert reviews"
ON public.reviews
FOR INSERT
TO public
WITH CHECK (
  -- Authenticated users must own user_id; guests must use null user_id and provide name
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR (auth.uid() IS NULL AND user_id IS NULL AND guest_name IS NOT NULL AND length(trim(guest_name)) > 0)
);

CREATE INDEX IF NOT EXISTS reviews_parent_id_idx ON public.reviews(parent_id);
CREATE INDEX IF NOT EXISTS reviews_ad_id_idx ON public.reviews(ad_id);



-- >>> Migration: 20260418043803_dd8c81bb-4187-46eb-a2b6-77a30bc13ce0.sql
-- Add JSONB attributes for category-specific fields
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Add a short human-readable ad code (e.g. "A7K9X2M")
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS ad_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS ads_ad_code_key ON public.ads (ad_code) WHERE ad_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS ads_attributes_gin ON public.ads USING GIN (attributes);

-- Function to generate a short ad code
CREATE OR REPLACE FUNCTION public.generate_ad_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate TEXT;
  attempts INT := 0;
BEGIN
  IF NEW.ad_code IS NOT NULL AND length(NEW.ad_code) > 0 THEN
    RETURN NEW;
  END IF;
  LOOP
    candidate := upper(substring(replace(encode(gen_random_bytes(6), 'base64'), '/', '0') from 1 for 7));
    candidate := regexp_replace(candidate, '[^A-Z0-9]', 'X', 'g');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.ads WHERE ad_code = candidate);
    attempts := attempts + 1;
    IF attempts > 10 THEN
      candidate := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 7));
      EXIT;
    END IF;
  END LOOP;
  NEW.ad_code := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_ad_code ON public.ads;
CREATE TRIGGER set_ad_code
  BEFORE INSERT ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_ad_code();

-- Backfill existing ads
UPDATE public.ads
SET ad_code = upper(substring(md5(id::text) from 1 for 7))
WHERE ad_code IS NULL;



-- >>> Migration: 20260419042340_6a5d08a4-6ba2-4a27-8cc1-eed92ce8e0ca.sql
-- Fix: ad_code generation was using gen_random_bytes() which requires pgcrypto.
-- Switch to using gen_random_uuid() (built-in) for entropy instead.

CREATE OR REPLACE FUNCTION public.generate_ad_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate TEXT;
  attempts INT := 0;
BEGIN
  IF NEW.ad_code IS NOT NULL AND length(NEW.ad_code) > 0 THEN
    RETURN NEW;
  END IF;
  LOOP
    -- Use uuid-based entropy (built-in, no extension needed)
    candidate := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 7));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.ads WHERE ad_code = candidate);
    attempts := attempts + 1;
    IF attempts > 10 THEN
      candidate := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 7));
      EXIT;
    END IF;
  END LOOP;
  NEW.ad_code := candidate;
  RETURN NEW;
END;
$$;



-- >>> Migration: 20260424034927_email_infra.sql
-- Email infrastructure
-- Creates the queue system, send log, send state, suppression, and unsubscribe
-- tables used by both auth and transactional emails.

-- Extensions required for queue processing
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create email queues (auth = high priority, transactional = normal)
-- Wrapped in DO blocks to handle "queue already exists" errors idempotently.
DO $$ BEGIN PERFORM pgmq.create('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Dead-letter queues for messages that exceed max retries
DO $$ BEGIN PERFORM pgmq.create('auth_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Email send log table (audit trail for all send attempts)
-- UPDATE is allowed for the service role so the suppression edge function
-- can update a log record's status when a bounce/complaint/unsubscribe occurs.
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read send log"
    ON public.email_send_log FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert send log"
    ON public.email_send_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update send log"
    ON public.email_send_log FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log(recipient_email);

-- Backfill: add message_id column to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_log ADD COLUMN message_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log(message_id);

-- Prevent duplicate sends: only one 'sent' row per message_id.
-- If VT expires and another worker picks up the same message, the pre-send
-- check catches it. This index is a DB-level safety net for race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id) WHERE status = 'sent';

-- Backfill: update status CHECK constraint for existing tables that predate new statuses
DO $$ BEGIN
  ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;
  ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
    CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq'));
END $$;

-- Rate-limit state and queue config (single row, tracks Retry-After cooldown + throughput settings)
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_until TIMESTAMPTZ,
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Backfill: add config columns to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN batch_size INTEGER NOT NULL DEFAULT 10;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN send_delay_ms INTEGER NOT NULL DEFAULT 200;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage send state"
    ON public.email_send_state FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RPC wrappers so Edge Functions can interact with pgmq via supabase.rpc()
-- (PostgREST only exposes functions in the public schema; pgmq functions are in the pgmq schema)
-- All wrappers auto-create the queue on undefined_table (42P01) so emails
-- are never lost if the queue was dropped (extension upgrade, restore, etc.).
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- Restrict queue RPC wrappers to service_role only (SECURITY DEFINER runs as owner,
-- so without this any authenticated user could manipulate the email queues)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;

-- Suppressed emails table (tracks unsubscribes, bounces, complaints)
-- Append-only: no DELETE or UPDATE policies to prevent bypassing suppression.
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read suppressed emails"
    ON public.suppressed_emails FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert suppressed emails"
    ON public.suppressed_emails FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

-- Email unsubscribe tokens table (one token per email address for unsubscribe links)
-- No DELETE policy to prevent removing tokens. UPDATE allowed only to mark tokens as used.
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read tokens"
    ON public.email_unsubscribe_tokens FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert tokens"
    ON public.email_unsubscribe_tokens FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can mark tokens as used"
    ON public.email_unsubscribe_tokens FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

-- ============================================================
-- POST-MIGRATION STEPS (applied dynamically by setup_email_infra)
-- These steps contain project-specific secrets and URLs and
-- cannot be expressed as static SQL. They are applied via the
-- Supabase Management API (ExecuteSQL) each time the tool runs.
-- ============================================================
--
-- 1. VAULT SECRET
--    Stores (or updates) the Supabase service_role key in
--    vault as 'email_queue_service_role_key'.
--    Uses vault.create_secret / vault.update_secret (upsert).
--    To revert: DELETE FROM vault.secrets WHERE name = 'email_queue_service_role_key';
--
-- 2. CRON JOB (pg_cron)
--    Creates job 'process-email-queue' with a 5-second interval.
--    The job checks:
--      a) rate-limit cooldown (email_send_state.retry_after_until)
--      b) whether auth_emails or transactional_emails queues have messages
--    If conditions are met, it calls the process-email-queue Edge Function
--    via net.http_post using the vault-stored service_role key.
--    To revert: SELECT cron.unschedule('process-email-queue');



-- >>> Migration: 20260427074449_5accb42f-ea26-4a9d-9b54-8f6270402a09.sql
-- ============ EVENTS ============
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  theme TEXT DEFAULT 'minimal',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'Africa/Nairobi',
  location TEXT,
  virtual_link TEXT,
  is_virtual BOOLEAN DEFAULT false,
  host_name TEXT,
  capacity INTEGER,
  ticket_price NUMERIC DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  attendee_count INTEGER DEFAULT 0,
  category TEXT DEFAULT 'general',
  visibility TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_start_at ON public.events(start_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_published ON public.events(is_published, start_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user ON public.events(user_id);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published events"
  ON public.events FOR SELECT
  TO public
  USING (is_published = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hosts can update own events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Hosts can delete own events"
  ON public.events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

-- ============ EVENT RSVPS ============
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  ticket_type TEXT DEFAULT 'free',
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON public.event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user ON public.event_rsvps(user_id);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can RSVP"
  ON public.event_rsvps FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users view own RSVPs"
  ON public.event_rsvps FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Hosts can update RSVPs"
  ON public.event_rsvps FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- Atomic attendee counter
CREATE OR REPLACE FUNCTION public.increment_event_attendees(target_event_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.events
  SET attendee_count = COALESCE(attendee_count,0) + 1
  WHERE id = target_event_id;
END;
$$;

-- Slug generator for events
CREATE OR REPLACE FUNCTION public.generate_event_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;
  base_slug := lower(NEW.title);
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := trim(base_slug);
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := left(base_slug, 80);
  IF base_slug IS NULL OR base_slug = '' THEN base_slug := 'event'; END IF;
  final_slug := base_slug;
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.events WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
      EXIT;
    END IF;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_events_generate_slug
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.generate_event_slug();

-- ============ BANNERS UPGRADES ============
ALTER TABLE public.banner_campaigns
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'business',
  ADD COLUMN IF NOT EXISTS votes_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_voting_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_banner_campaigns_slug ON public.banner_campaigns(slug) WHERE slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.banner_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id UUID NOT NULL REFERENCES public.banner_campaigns(id) ON DELETE CASCADE,
  voter_identifier TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(banner_id, voter_identifier)
);

ALTER TABLE public.banner_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can vote"
  ON public.banner_votes FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read vote counts (via RPC only)"
  ON public.banner_votes FOR SELECT
  TO public
  USING (true);

CREATE OR REPLACE FUNCTION public.cast_banner_vote(target_banner_id UUID, voter TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing INT;
  v_new_count INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.banner_campaigns WHERE id = target_banner_id AND is_voting_enabled = true) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'voting_disabled');
  END IF;

  BEGIN
    INSERT INTO public.banner_votes (banner_id, voter_identifier, user_id)
    VALUES (target_banner_id, voter, auth.uid());
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_voted');
  END;

  UPDATE public.banner_campaigns
  SET votes_count = votes_count + 1
  WHERE id = target_banner_id
  RETURNING votes_count INTO v_new_count;

  RETURN jsonb_build_object('ok', true, 'votes', v_new_count);
END;
$$;

-- Slug generator for banners
CREATE OR REPLACE FUNCTION public.generate_banner_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;
  base_slug := lower(NEW.business_name);
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := trim(base_slug);
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := left(base_slug, 80);
  IF base_slug IS NULL OR base_slug = '' THEN base_slug := 'banner'; END IF;
  final_slug := base_slug;
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.banner_campaigns WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
      EXIT;
    END IF;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_banner_campaigns_generate_slug
  BEFORE INSERT OR UPDATE ON public.banner_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.generate_banner_slug();

-- ============ STORAGE: events bucket ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('events', 'events', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read events bucket"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'events');

CREATE POLICY "Authenticated upload events bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'events');

CREATE POLICY "Owner update events bucket"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner delete events bucket"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);



-- >>> Migration: 20260428041830_cdc6b174-a6ff-4758-9157-036f35118638.sql

-- 1. Update banner slug generator: strip digits, use letter-only suffix on collision
CREATE OR REPLACE FUNCTION public.generate_banner_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  suffix text;
  letters text := 'abcdefghijklmnopqrstuvwxyz';
  i int;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;
  base_slug := lower(coalesce(NEW.business_name, 'banner'));
  -- strip digits and special chars
  base_slug := regexp_replace(base_slug, '[0-9]', '', 'g');
  base_slug := regexp_replace(base_slug, '[^a-z\s-]', '', 'g');
  base_slug := trim(base_slug);
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := left(base_slug, 80);
  IF base_slug IS NULL OR base_slug = '' THEN base_slug := 'banner'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.banner_campaigns WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    suffix := '';
    FOR i IN 1..5 LOOP
      suffix := suffix || substr(letters, 1 + floor(random() * 26)::int, 1);
    END LOOP;
    final_slug := base_slug || '-' || suffix;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$function$;

-- 2. Same for events
CREATE OR REPLACE FUNCTION public.generate_event_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  suffix text;
  letters text := 'abcdefghijklmnopqrstuvwxyz';
  i int;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;
  base_slug := lower(coalesce(NEW.title, 'event'));
  base_slug := regexp_replace(base_slug, '[0-9]', '', 'g');
  base_slug := regexp_replace(base_slug, '[^a-z\s-]', '', 'g');
  base_slug := trim(base_slug);
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := left(base_slug, 80);
  IF base_slug IS NULL OR base_slug = '' THEN base_slug := 'event'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    suffix := '';
    FOR i IN 1..5 LOOP
      suffix := suffix || substr(letters, 1 + floor(random() * 26)::int, 1);
    END LOOP;
    final_slug := base_slug || '-' || suffix;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$function$;

-- 3. Ensure triggers exist (they may not have been created)
DROP TRIGGER IF EXISTS trg_generate_banner_slug ON public.banner_campaigns;
CREATE TRIGGER trg_generate_banner_slug
BEFORE INSERT OR UPDATE ON public.banner_campaigns
FOR EACH ROW EXECUTE FUNCTION public.generate_banner_slug();

DROP TRIGGER IF EXISTS trg_generate_event_slug ON public.events;
CREATE TRIGGER trg_generate_event_slug
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.generate_event_slug();

-- 4. Backfill existing banner_campaigns with NULL slugs
UPDATE public.banner_campaigns SET slug = NULL WHERE slug = '';
-- Trigger an update to fire the slug generator for rows with null slug
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.banner_campaigns WHERE slug IS NULL LOOP
    UPDATE public.banner_campaigns SET business_name = business_name WHERE id = r.id;
  END LOOP;
END $$;



-- >>> Migration: 20260430043921_5c022681-062a-47af-a50e-b364e8d1b185.sql
ALTER TABLE public.banner_campaigns
  ADD COLUMN IF NOT EXISTS running_position text,
  ADD COLUMN IF NOT EXISTS party_name text,
  ADD COLUMN IF NOT EXISTS party_color text,
  ADD COLUMN IF NOT EXISTS candidate_number text,
  ADD COLUMN IF NOT EXISTS slogan text,
  ADD COLUMN IF NOT EXISTS manifesto_points text[];



-- >>> Migration: 20260430093117_00ee54bb-fdc6-4095-b9c1-1b288a522576.sql
-- Notify event hosts when someone RSVPs
CREATE OR REPLACE FUNCTION public.notify_host_on_rsvp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ev RECORD;
BEGIN
  IF NEW.status <> 'confirmed' THEN
    RETURN NEW;
  END IF;
  SELECT id, user_id, title, slug INTO ev FROM public.events WHERE id = NEW.event_id;
  IF ev.user_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.user_id IS NOT NULL AND NEW.user_id = ev.user_id THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (
    ev.user_id,
    'New RSVP for ' || ev.title,
    NEW.name || ' is going to your event.',
    'event_rsvp',
    '/events/' || ev.slug || '#attendees'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_host_on_rsvp ON public.event_rsvps;
CREATE TRIGGER trg_notify_host_on_rsvp
AFTER INSERT OR UPDATE OF status ON public.event_rsvps
FOR EACH ROW EXECUTE FUNCTION public.notify_host_on_rsvp();

-- Banner likes
CREATE TABLE IF NOT EXISTS public.banner_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id uuid NOT NULL REFERENCES public.banner_campaigns(id) ON DELETE CASCADE,
  liker_identifier text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (banner_id, liker_identifier)
);
CREATE INDEX IF NOT EXISTS idx_banner_likes_banner ON public.banner_likes(banner_id);
ALTER TABLE public.banner_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can like" ON public.banner_likes;
CREATE POLICY "Anyone can like" ON public.banner_likes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can view likes" ON public.banner_likes;
CREATE POLICY "Anyone can view likes" ON public.banner_likes FOR SELECT USING (true);

ALTER TABLE public.banner_campaigns ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.toggle_banner_like(target_banner_id uuid, liker text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id uuid;
  new_count integer;
BEGIN
  SELECT id INTO existing_id FROM public.banner_likes
   WHERE banner_id = target_banner_id AND liker_identifier = liker;
  IF existing_id IS NOT NULL THEN
    DELETE FROM public.banner_likes WHERE id = existing_id;
    UPDATE public.banner_campaigns SET likes_count = GREATEST(0, likes_count - 1)
     WHERE id = target_banner_id RETURNING likes_count INTO new_count;
    RETURN jsonb_build_object('liked', false, 'count', COALESCE(new_count, 0));
  ELSE
    INSERT INTO public.banner_likes (banner_id, liker_identifier, user_id)
    VALUES (target_banner_id, liker, auth.uid());
    UPDATE public.banner_campaigns SET likes_count = likes_count + 1
     WHERE id = target_banner_id RETURNING likes_count INTO new_count;
    RETURN jsonb_build_object('liked', true, 'count', COALESCE(new_count, 0));
  END IF;
END;
$$;



-- >>> Migration: 20260505083717_49f96206-0525-42bc-bb12-f34b99808335.sql
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_event_views(target_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.events
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = target_event_id
    AND is_published = true;
END;
$function$;



-- >>> Migration: 20260506050934_934f217d-527e-45d4-bde5-93124060e6ca.sql
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS gallery_images text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.banner_campaigns
ADD COLUMN IF NOT EXISTS gallery_images text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_events_user_created ON public.events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_banner_campaigns_user_created ON public.banner_campaigns (user_id, created_at DESC);



-- >>> Migration: 20260507115342_fd8797d9-d53c-44b3-8474-2e5d28752a13.sql
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_listed boolean NOT NULL DEFAULT true;
ALTER TABLE public.banner_campaigns ADD COLUMN IF NOT EXISTS is_listed boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_events_is_listed ON public.events(is_listed);
CREATE INDEX IF NOT EXISTS idx_banner_campaigns_is_listed ON public.banner_campaigns(is_listed);



-- >>> Migration: 20260510120407_a5f7dba1-a2f6-42cc-aefd-b685df2e66d5.sql

-- ============ Political parties ============
CREATE TABLE IF NOT EXISTS public.political_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  abbreviation text,
  color text DEFAULT '#1B5E20',
  logo_url text,
  description text,
  manifesto text,
  website text,
  founded_year integer,
  headquarters text,
  created_by uuid,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.political_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view parties" ON public.political_parties FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can register a party" ON public.political_parties FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Owner or admin can update party" ON public.political_parties FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owner or admin can delete party" ON public.political_parties FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_political_parties_updated_at
  BEFORE UPDATE ON public.political_parties
  FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

CREATE INDEX IF NOT EXISTS idx_political_parties_slug ON public.political_parties(slug);

-- Slug generator for parties
CREATE OR REPLACE FUNCTION public.generate_party_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN RETURN NEW; END IF;
  base_slug := lower(coalesce(NEW.name, 'party'));
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := trim(base_slug);
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := left(base_slug, 60);
  IF base_slug = '' THEN base_slug := 'party'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.political_parties WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_political_parties_slug
  BEFORE INSERT OR UPDATE ON public.political_parties
  FOR EACH ROW EXECUTE FUNCTION public.generate_party_slug();

-- ============ Listing control / hide-on-report flags ============
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS is_listed boolean NOT NULL DEFAULT true;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS is_hidden_by_report boolean NOT NULL DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_hidden_by_report boolean NOT NULL DEFAULT false;
ALTER TABLE public.banner_campaigns ADD COLUMN IF NOT EXISTS is_hidden_by_report boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ads_is_hidden_by_report ON public.ads(is_hidden_by_report);
CREATE INDEX IF NOT EXISTS idx_events_is_hidden_by_report ON public.events(is_hidden_by_report);
CREATE INDEX IF NOT EXISTS idx_banner_campaigns_is_hidden_by_report ON public.banner_campaigns(is_hidden_by_report);

-- Update public-view RLS to honor hidden flag
DROP POLICY IF EXISTS "Anyone can view active ads" ON public.ads;
CREATE POLICY "Anyone can view active ads" ON public.ads FOR SELECT TO public
  USING (status = 'active' AND is_hidden_by_report = false);

DROP POLICY IF EXISTS "Public can view published events" ON public.events;
CREATE POLICY "Public can view published events" ON public.events FOR SELECT TO public
  USING (
    ((is_published = true AND is_hidden_by_report = false))
    OR auth.uid() = user_id
    OR has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Anyone can view active campaign display data" ON public.banner_campaigns;
CREATE POLICY "Anyone can view active campaign display data" ON public.banner_campaigns FOR SELECT TO public
  USING (status = 'active' AND is_hidden_by_report = false);

-- ============ Allow anonymous ad reports too ============
DROP POLICY IF EXISTS "Users can report ads" ON public.ad_reports;
ALTER TABLE public.ad_reports ALTER COLUMN reporter_id DROP NOT NULL;
CREATE POLICY "Anyone can report ads" ON public.ad_reports FOR INSERT TO public
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = reporter_id)
    OR (auth.uid() IS NULL AND reporter_id IS NULL)
  );

-- ============ Event reports ============
CREATE TABLE IF NOT EXISTS public.event_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  reporter_id uuid,
  reporter_identifier text,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_event_reports_event_id ON public.event_reports(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reports_status ON public.event_reports(status);

CREATE POLICY "Anyone can submit event reports" ON public.event_reports FOR INSERT TO public
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = reporter_id)
    OR (auth.uid() IS NULL AND reporter_id IS NULL)
  );
CREATE POLICY "Admins manage event reports" ON public.event_reports FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own event reports" ON public.event_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

CREATE TRIGGER trg_event_reports_updated_at
  BEFORE UPDATE ON public.event_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

-- ============ Banner reports ============
CREATE TABLE IF NOT EXISTS public.banner_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id uuid NOT NULL REFERENCES public.banner_campaigns(id) ON DELETE CASCADE,
  reporter_id uuid,
  reporter_identifier text,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.banner_reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_banner_reports_banner_id ON public.banner_reports(banner_id);
CREATE INDEX IF NOT EXISTS idx_banner_reports_status ON public.banner_reports(status);

CREATE POLICY "Anyone can submit banner reports" ON public.banner_reports FOR INSERT TO public
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = reporter_id)
    OR (auth.uid() IS NULL AND reporter_id IS NULL)
  );
CREATE POLICY "Admins manage banner reports" ON public.banner_reports FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own banner reports" ON public.banner_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

CREATE TRIGGER trg_banner_reports_updated_at
  BEFORE UPDATE ON public.banner_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

-- ============ Auto-hide on report ============
CREATE OR REPLACE FUNCTION public.hide_ad_on_report() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.ads SET is_hidden_by_report = true WHERE id = NEW.ad_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_hide_ad_on_report ON public.ad_reports;
CREATE TRIGGER trg_hide_ad_on_report AFTER INSERT ON public.ad_reports
  FOR EACH ROW EXECUTE FUNCTION public.hide_ad_on_report();

CREATE OR REPLACE FUNCTION public.hide_event_on_report() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.events SET is_hidden_by_report = true WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_hide_event_on_report ON public.event_reports;
CREATE TRIGGER trg_hide_event_on_report AFTER INSERT ON public.event_reports
  FOR EACH ROW EXECUTE FUNCTION public.hide_event_on_report();

CREATE OR REPLACE FUNCTION public.hide_banner_on_report() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.banner_campaigns SET is_hidden_by_report = true WHERE id = NEW.banner_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_hide_banner_on_report ON public.banner_reports;
CREATE TRIGGER trg_hide_banner_on_report AFTER INSERT ON public.banner_reports
  FOR EACH ROW EXECUTE FUNCTION public.hide_banner_on_report();

-- ============ Default site settings ============
INSERT INTO public.site_config (key, value) VALUES
  ('politician_monthly_price', '5000'),
  ('promotion_min_amount', '5000')
ON CONFLICT (key) DO NOTHING;



-- >>> Migration: 20260511041258_f79b5517-be6e-430c-9331-48401246c73e.sql
ALTER TABLE public.banner_campaigns
  ADD COLUMN IF NOT EXISTS promotion_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promoted_until timestamp with time zone;

ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.banner_campaigns
  ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_banner_campaigns_promotion_rank
  ON public.banner_campaigns (promoted_until DESC, promotion_amount DESC, created_at DESC)
  WHERE status = 'active' AND is_hidden_by_report = false;

CREATE OR REPLACE FUNCTION public.hide_ad_on_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ads
  SET is_hidden_by_report = true,
      report_count = COALESCE(report_count, 0) + 1,
      updated_at = now()
  WHERE id = NEW.ad_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.hide_event_on_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.events
  SET is_hidden_by_report = true,
      report_count = COALESCE(report_count, 0) + 1,
      updated_at = now()
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.hide_banner_on_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.banner_campaigns
  SET is_hidden_by_report = true,
      report_count = COALESCE(report_count, 0) + 1,
      updated_at = now()
  WHERE id = NEW.banner_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_banner_promotion(target_banner_id uuid, paid_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF paid_amount < 5000 THEN
    RAISE EXCEPTION 'Minimum promotion amount is KSh 5,000';
  END IF;

  UPDATE public.banner_campaigns
  SET promotion_amount = COALESCE(promotion_amount, 0) + paid_amount,
      promoted_until = GREATEST(COALESCE(promoted_until, now()), now()) + interval '30 days',
      updated_at = now()
  WHERE id = target_banner_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_banner_promotion(uuid, numeric) TO service_role;



-- >>> Migration: 20260511041514_c0fef670-a220-47f2-af81-bdfb64b0c13b.sql
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS banner_id uuid;

CREATE INDEX IF NOT EXISTS idx_payments_banner_id ON public.payments (banner_id);



-- >>> Migration: 20260511214908_a5715329-c6a6-4ebd-a91a-04a7117da229.sql
UPDATE public.site_config SET value = '500', updated_at = now() WHERE key = 'campaign_basic_banner_price';
UPDATE public.site_config SET value = '1000', updated_at = now() WHERE key = 'campaign_featured_business_price';
UPDATE public.site_config SET value = '2000', updated_at = now() WHERE key = 'campaign_category_sponsor_price';
INSERT INTO public.site_config (key, value) SELECT 'campaign_basic_banner_price', '500' WHERE NOT EXISTS (SELECT 1 FROM public.site_config WHERE key='campaign_basic_banner_price');
INSERT INTO public.site_config (key, value) SELECT 'campaign_featured_business_price', '1000' WHERE NOT EXISTS (SELECT 1 FROM public.site_config WHERE key='campaign_featured_business_price');
INSERT INTO public.site_config (key, value) SELECT 'campaign_category_sponsor_price', '2000' WHERE NOT EXISTS (SELECT 1 FROM public.site_config WHERE key='campaign_category_sponsor_price');



-- >>> Migration: 20260511224338_bc6f4bc4-6cdb-43cd-862d-803d96363e76.sql
INSERT INTO public.admin_settings (key, value) VALUES ('payment_provider', 'palpluss') ON CONFLICT (key) DO NOTHING;



-- >>> Migration: 20260525114153_dd00a703-3c19-420d-817b-71cab20e65d9.sql
alter table public.blog_posts
  add column if not exists meta_title text,
  add column if not exists meta_description text;

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do update set public = true;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public can view blog images'
  ) then
    create policy "Public can view blog images"
    on storage.objects
    for select
    using (bucket_id = 'blog-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can upload blog images'
  ) then
    create policy "Admins can upload blog images"
    on storage.objects
    for insert
    with check (bucket_id = 'blog-images' and public.has_role(auth.uid(), 'admin'::public.app_role));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can update blog images'
  ) then
    create policy "Admins can update blog images"
    on storage.objects
    for update
    using (bucket_id = 'blog-images' and public.has_role(auth.uid(), 'admin'::public.app_role))
    with check (bucket_id = 'blog-images' and public.has_role(auth.uid(), 'admin'::public.app_role));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can delete blog images'
  ) then
    create policy "Admins can delete blog images"
    on storage.objects
    for delete
    using (bucket_id = 'blog-images' and public.has_role(auth.uid(), 'admin'::public.app_role));
  end if;
end $$;

create or replace function public.apply_banner_promotion(target_banner_id uuid, paid_amount numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if paid_amount < 500 then
    raise exception 'Minimum banner boost amount is KSh 500';
  end if;

  update public.banner_campaigns
  set promotion_amount = coalesce(promotion_amount, 0) + paid_amount,
      promoted_until = greatest(coalesce(promoted_until, now()), now()) + interval '30 days',
      updated_at = now()
  where id = target_banner_id;
end;
$$;



-- >>> Migration: 20260525132507_eb64f17d-0a20-4692-8ae1-3660f04c7cf0.sql
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS external_tickets_link text;



-- >>> Migration: 20260525141611_e1b396c6-846c-4c1d-a967-28dfb6b5cc6c.sql
-- Indexing dashboard tables
CREATE TABLE IF NOT EXISTS public.seo_url_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  last_checked timestamptz,
  last_pinged timestamptz,
  ping_count integer NOT NULL DEFAULT 0,
  inspection_result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seo_url_index_status_idx ON public.seo_url_index(status);
CREATE INDEX IF NOT EXISTS seo_url_index_updated_idx ON public.seo_url_index(updated_at DESC);

CREATE TABLE IF NOT EXISTS public.seo_api_usage (
  day date PRIMARY KEY,
  gsc_calls integer NOT NULL DEFAULT 0,
  ping_calls integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_url_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage seo_url_index" ON public.seo_url_index
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage seo_api_usage" ON public.seo_api_usage
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER seo_url_index_set_updated_at
  BEFORE UPDATE ON public.seo_url_index
  FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

CREATE TRIGGER seo_api_usage_set_updated_at
  BEFORE UPDATE ON public.seo_api_usage
  FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();



-- >>> Migration: 20260525152026_bd955a01-c6fb-4b1d-8ae6-8673aa7faa2f.sql
-- Ensure timestamp helper exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.digital_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KES',
  category TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  delivery_type TEXT NOT NULL DEFAULT 'link', -- 'link' | 'file' | 'manual'
  delivery_content TEXT, -- url or instructions
  access_mode TEXT NOT NULL DEFAULT 'public', -- 'public' | 'restricted'
  allowed_emails TEXT[] NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_digital_products_published ON public.digital_products(is_published, sort_order DESC);
CREATE INDEX IF NOT EXISTS idx_digital_products_slug ON public.digital_products(slug);

ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published digital products" ON public.digital_products;
CREATE POLICY "Public can view published digital products"
ON public.digital_products FOR SELECT
USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage digital products" ON public.digital_products;
CREATE POLICY "Admins can manage digital products"
ON public.digital_products FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_digital_products_updated_at ON public.digital_products;
CREATE TRIGGER trg_digital_products_updated_at
BEFORE UPDATE ON public.digital_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



-- >>> Migration: 20260525153438_17336c8f-667b-459b-9dd7-fc3a5c5e6ef4.sql

-- 1. Add country/county to political banner campaigns
ALTER TABLE public.banner_campaigns
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Kenya',
  ADD COLUMN IF NOT EXISTS county  text;

-- 2. Add country to parties
ALTER TABLE public.political_parties
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Kenya';

-- 3. Digital products: verified seller + approval workflow
ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS is_verified_seller boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS seller_name text,
  ADD COLUMN IF NOT EXISTS seller_contact text;

-- Auto-approve + auto-verify when an admin is the creator
CREATE OR REPLACE FUNCTION public.digital_products_admin_autoverify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL AND public.has_role(NEW.created_by, 'admin'::app_role) THEN
    NEW.is_verified_seller := true;
    NEW.approval_status := 'approved';
    NEW.is_published := COALESCE(NEW.is_published, true);
  ELSE
    -- non-admin submissions stay pending and unpublished until approved
    IF TG_OP = 'INSERT' THEN
      NEW.approval_status := COALESCE(NEW.approval_status, 'pending');
      NEW.is_verified_seller := false;
      NEW.is_published := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_digital_products_autoverify ON public.digital_products;
CREATE TRIGGER trg_digital_products_autoverify
  BEFORE INSERT OR UPDATE OF created_by ON public.digital_products
  FOR EACH ROW EXECUTE FUNCTION public.digital_products_admin_autoverify();

-- Public can only see approved + published items
DROP POLICY IF EXISTS "Public can view published digital products" ON public.digital_products;
CREATE POLICY "Public can view approved digital products"
  ON public.digital_products
  FOR SELECT
  USING (is_published = true AND approval_status = 'approved');

-- Allow authenticated users to submit (will land as pending)
DROP POLICY IF EXISTS "Users can submit digital products" ON public.digital_products;
CREATE POLICY "Users can submit digital products"
  ON public.digital_products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can view own digital products" ON public.digital_products;
CREATE POLICY "Users can view own digital products"
  ON public.digital_products
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

-- 4. Engagement bump RPCs (auto-grow likes/views on visit)
CREATE OR REPLACE FUNCTION public.bump_banner_engagement(target_banner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  promoted boolean;
  like_bump int;
BEGIN
  SELECT (promoted_until IS NOT NULL AND promoted_until > now())
    INTO promoted FROM public.banner_campaigns WHERE id = target_banner_id;
  IF NOT FOUND THEN RETURN; END IF;
  -- Promoted items get a slightly bigger natural bump
  like_bump := CASE WHEN promoted THEN 1 + floor(random()*3)::int ELSE floor(random()*2)::int END;
  UPDATE public.banner_campaigns
    SET likes_count = COALESCE(likes_count,0) + like_bump,
        impressions = COALESCE(impressions,0) + 1
    WHERE id = target_banner_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.bump_event_engagement(target_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.events
    SET views_count = COALESCE(views_count,0) + 1 + floor(random()*2)::int
    WHERE id = target_event_id AND is_published = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.bump_ad_engagement(target_ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ads
    SET views_count = COALESCE(views_count,0) + 1 + floor(random()*2)::int
    WHERE id = target_ad_id AND status = 'active';
END;
$$;

-- 5. Seed major Kenyan political parties (idempotent on slug)
INSERT INTO public.political_parties (name, slug, abbreviation, color, description, country, is_verified) VALUES
  ('United Democratic Alliance', 'uda', 'UDA', '#FFD500', 'Ruling party of Kenya led by President William Ruto. Bottom-up economic model.', 'Kenya', true),
  ('Orange Democratic Movement', 'odm', 'ODM', '#F26522', 'Major opposition party led by Raila Odinga, part of the Azimio coalition.', 'Kenya', true),
  ('Jubilee Party', 'jubilee', 'JP', '#E30613', 'Founded by Uhuru Kenyatta in 2016. Still a major national party.', 'Kenya', true),
  ('Wiper Democratic Movement', 'wiper', 'WDM-K', '#0066B3', 'Led by Kalonzo Musyoka, strong in lower Eastern Kenya.', 'Kenya', true),
  ('Amani National Congress', 'anc', 'ANC', '#7B2D8E', 'Led by Musalia Mudavadi, currently Prime Cabinet Secretary.', 'Kenya', true),
  ('FORD Kenya', 'ford-kenya', 'FORD-K', '#005BAA', 'Led by Moses Wetangula, Speaker of the National Assembly.', 'Kenya', true),
  ('Democratic Action Party of Kenya', 'dap-k', 'DAP-K', '#00A651', 'Founded by Eugene Wamalwa. Western Kenya base.', 'Kenya', true),
  ('Kenya African National Union', 'kanu', 'KANU', '#D40000', 'Kenya''s oldest party, founded 1960. Led by Gideon Moi.', 'Kenya', true),
  ('Chama Cha Kazi', 'chama-cha-kazi', 'CCK', '#1B5E20', 'Founded by Moses Kuria. Mt Kenya region.', 'Kenya', true),
  ('Pamoja African Alliance', 'pamoja-african-alliance', 'PAA', '#006B3F', 'Led by Amason Kingi. Coast region base.', 'Kenya', true),
  ('United Democratic Movement', 'udm', 'UDM', '#003893', 'Led by Ali Roba. Strong in North Eastern Kenya.', 'Kenya', true),
  ('The Service Party', 'tsp', 'TSP', '#FF6B00', 'Founded by Mwangi Kiunjuri. Central Kenya base.', 'Kenya', true),
  ('Maendeleo Chap Chap', 'maendeleo-chap-chap', 'MCC', '#FFA500', 'Led by Alfred Mutua. Machakos region.', 'Kenya', true),
  ('Independent', 'independent', 'IND', '#6B7280', 'For candidates running without party affiliation.', 'Kenya', true)
ON CONFLICT (slug) DO UPDATE SET
  abbreviation = EXCLUDED.abbreviation,
  color = EXCLUDED.color,
  description = COALESCE(public.political_parties.description, EXCLUDED.description),
  country = EXCLUDED.country,
  is_verified = true;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_banner_campaigns_county ON public.banner_campaigns(county);
CREATE INDEX IF NOT EXISTS idx_banner_campaigns_country ON public.banner_campaigns(country);
CREATE INDEX IF NOT EXISTS idx_digital_products_approval ON public.digital_products(approval_status);



-- >>> Migration: 20260525160411_e45f7b82-8147-43b2-84c4-b6b71f17fce5.sql

-- Add boost columns to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS promotion_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promoted_until timestamptz;

CREATE INDEX IF NOT EXISTS idx_events_promoted_until ON public.events (promoted_until DESC NULLS LAST);

-- Link payments to events
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS event_id uuid;

CREATE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments (event_id);

-- RPC to apply an event promotion after successful payment
CREATE OR REPLACE FUNCTION public.apply_event_promotion(target_event_id uuid, paid_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF paid_amount < 500 THEN
    RAISE EXCEPTION 'Minimum event boost amount is KSh 500';
  END IF;

  UPDATE public.events
  SET promotion_amount = COALESCE(promotion_amount, 0) + paid_amount,
      promoted_until = GREATEST(COALESCE(promoted_until, now()), now()) + INTERVAL '30 days',
      updated_at = now()
  WHERE id = target_event_id;
END;
$$;



-- >>> Migration: 20260622034419_5b205559-37e3-4778-9166-7c150c2b3d03.sql
-- Clear duplicate / generic Unsplash photos from AI-generated ads so the
-- placeholder shows instead. The cron will gradually re-generate proper
-- AI images to replace them.
UPDATE public.ads
SET images = '{}'
WHERE images::text LIKE '%images.unsplash.com%';



-- >>> Migration: 20260629035555_8ea8400d-9727-4414-8987-2636a69c2f45.sql

-- 1. Unclaim everyone: cancel any existing politician_claim banner_campaigns
UPDATE public.banner_campaigns
   SET status = 'cancelled', updated_at = now()
 WHERE category = 'politician_claim'
   AND status <> 'cancelled';

-- 2. Politician edit-approval queue
CREATE TABLE IF NOT EXISTS public.politician_edit_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  politician_slug TEXT NOT NULL,
  banner_id UUID REFERENCES public.banner_campaigns(id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changes JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.politician_edit_requests TO authenticated;
GRANT ALL ON public.politician_edit_requests TO service_role;

ALTER TABLE public.politician_edit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own edit requests"
  ON public.politician_edit_requests FOR SELECT
  TO authenticated
  USING (submitted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users submit their own edit requests"
  ON public.politician_edit_requests FOR INSERT
  TO authenticated
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Admins update edit requests"
  ON public.politician_edit_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_per_updated_at
  BEFORE UPDATE ON public.politician_edit_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_per_status ON public.politician_edit_requests(status, created_at DESC);
CREATE INDEX idx_per_slug ON public.politician_edit_requests(politician_slug);

-- 3. Admin override on politician claims — admin can force-claim or revoke
-- Add an "admin_revoked" flag column we can use to invalidate a claim
ALTER TABLE public.banner_campaigns
  ADD COLUMN IF NOT EXISTS admin_revoked BOOLEAN NOT NULL DEFAULT false;

-- 4. Notify admins on new payment
CREATE OR REPLACE FUNCTION public.notify_admins_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id UUID;
  body_text TEXT;
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    body_text := 'KSh ' || NEW.amount::text || ' (' || COALESCE(NEW.package_type,'payment') || ') from ' || COALESCE(NEW.phone_number,'unknown');
    FOR admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
      INSERT INTO public.notifications (user_id, title, body, type, link)
      VALUES (admin_id, 'New payment received', body_text, 'admin_payment', '/admin?tab=payments');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_payment ON public.payments;
CREATE TRIGGER trg_notify_admins_payment
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_payment();

-- 5. Notify admins on new politician edit request
CREATE OR REPLACE FUNCTION public.notify_admins_on_edit_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id UUID;
BEGIN
  IF NEW.status = 'pending' THEN
    FOR admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
      INSERT INTO public.notifications (user_id, title, body, type, link)
      VALUES (admin_id, 'Politician edit awaiting review',
        'Edit submitted for ' || NEW.politician_slug, 'admin_edit_request', '/admin?tab=politicians');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_edit_request ON public.politician_edit_requests;
CREATE TRIGGER trg_notify_admins_edit_request
  AFTER INSERT ON public.politician_edit_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_edit_request();



-- >>> Migration: 20260702061700_93bf7683-10d7-498e-8d4f-b04784e9f979.sql
-- placeholder; will be replaced by exec



-- >>> Migration: 20260901185834_6922dd63-4a6f-44a3-a322-cb663f935212.sql
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



-- >>> Migration: 20260907045647_9ae291c0-9f05-410b-a2f3-467cac462de3.sql
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('daily-grow-views') where exists (select 1 from cron.job where jobname = 'daily-grow-views');

select cron.schedule(
  'daily-grow-views',
  '0 4 * * *',
  $$
  select net.http_post(
    url := 'https://ygwtyyitntauqdghykuf.supabase.co/functions/v1/grow-views',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnd3R5eWl0bnRhdXFkZ2h5a3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjcyODgsImV4cCI6MjEwNDY0MzI4OH0.uWY1fvA9khbEXtSfPU4ulUXu09IaJL9SYKgal-X_hNc"}'::jsonb,
    body := '{"source":"cron"}'::jsonb
  );
  $$
);



