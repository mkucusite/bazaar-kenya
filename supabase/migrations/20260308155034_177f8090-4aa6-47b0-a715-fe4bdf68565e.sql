
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
