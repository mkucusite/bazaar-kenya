
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
