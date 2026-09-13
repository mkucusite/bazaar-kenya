-- Migration: 20260913_publish_curated_content.sql
-- Description: Publishes curated, top-tier Kenyan content across all categories
-- (Spas/Wellness, Salons, Restaurants, Jobs, Hotels, Tours, Events, Digital Products, Classifieds)
-- Associated with the admin account (hydrocephcare@gmail.com)

DO $$
DECLARE
  v_admin_id UUID;
  v_phone TEXT := '+254700123456';
  v_wa TEXT := '+254700123456';

  -- Category and Subcategory dynamic IDs
  v_cat_vehicles UUID;
  v_subcat_cars UUID;
  v_cat_electronics UUID;
  v_subcat_phones UUID;
  v_subcat_laptops UUID;
  v_cat_property UUID;
  v_subcat_rent UUID;
  v_subcat_land UUID;
  v_cat_farming UUID;
  v_cat_services UUID;
BEGIN
  -- 1. Identify admin user id by email matching hydrocephcare
  SELECT id INTO v_admin_id FROM auth.users WHERE email ILIKE '%hydrocephcare%' LIMIT 1;

  -- Fallback to first auth user or profiles if not yet registered under that exact email
  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  END IF;

  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM public.profiles ORDER BY id ASC LIMIT 1;
  END IF;

  IF v_admin_id IS NULL THEN
    v_admin_id := '55555555-5555-5555-5555-555555555555'::UUID;
  END IF;

  -- Ensure profile exists
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (v_admin_id, 'KenyaAdvert Official', v_phone)
  ON CONFLICT (id) DO UPDATE SET 
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone);

  -- Grant admin role in user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_admin_id, 'admin')
  ON CONFLICT DO NOTHING;

  -- Lookup Category and Subcategory UUIDs dynamically
  SELECT id INTO v_cat_vehicles FROM public.categories WHERE name ILIKE '%Vehicles%' LIMIT 1;
  SELECT id INTO v_subcat_cars FROM public.subcategories WHERE name ILIKE '%Cars%' AND category_id = v_cat_vehicles LIMIT 1;

  SELECT id INTO v_cat_electronics FROM public.categories WHERE name ILIKE '%Electronics%' LIMIT 1;
  SELECT id INTO v_subcat_phones FROM public.subcategories WHERE name ILIKE '%Phone%' AND category_id = v_cat_electronics LIMIT 1;
  SELECT id INTO v_subcat_laptops FROM public.subcategories WHERE name ILIKE '%Laptop%' AND category_id = v_cat_electronics LIMIT 1;

  SELECT id INTO v_cat_property FROM public.categories WHERE name ILIKE '%Property%' LIMIT 1;
  SELECT id INTO v_subcat_rent FROM public.subcategories WHERE name ILIKE '%Rent%' AND category_id = v_cat_property LIMIT 1;
  SELECT id INTO v_subcat_land FROM public.subcategories WHERE name ILIKE '%Land%' AND category_id = v_cat_property LIMIT 1;

  SELECT id INTO v_cat_farming FROM public.categories WHERE name ILIKE '%Farm%' LIMIT 1;
  SELECT id INTO v_cat_services FROM public.categories WHERE name ILIKE '%Service%' LIMIT 1;

  -- ============================================================================
  -- 2. DIRECTORY PROFILES: SPAS & WELLNESS (kind = 'wellness')
  -- ============================================================================
  INSERT INTO public.directory_profiles (
    id, user_id, kind, name, slug, headline, description, county, town, location_name,
    phone, whatsapp, website, price, price_label, tags, images, avatar_url,
    is_verified, is_featured, is_published, is_manual, created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(), v_admin_id, 'wellness', 'Serenity Spa Gigiri', 'serenity-spa-gigiri',
    'Premier Luxury Day Spa & Holistic Wellness Haven in Gigiri',
    'Serenity Spa is an award-winning day spa offering bespoke therapeutic massages, holistic body rituals, anti-ageing facials, and organic wellness therapies in an idyllic, leafy garden setting in Gigiri, near the UN Complex.',
    'Nairobi', 'Gigiri', 'UN Crescent, Gigiri, Nairobi',
    '+254708155551', '+254708155551', 'https://www.serenityspa.co.ke', 4500, 'From KSh 4,500',
    ARRAY['Day Spa', 'Deep Tissue', 'Swedish Massage', 'Aromatherapy', 'Holistic Facials'],
    ARRAY['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&fit=crop', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'wellness', 'Kaya Spa - Tribe Hotel', 'kaya-spa-tribe-hotel',
    'Urban Sanctuary Offering Hydrotherapy & Sensory Spa Rituals',
    'Nestled within the luxurious Tribe Hotel in Village Market, Kaya Spa blends international wellness techniques with African botanicals. Features private treatment studios, rain showers, sauna, and couple hydrotherapy suites.',
    'Nairobi', 'Gigiri', 'Village Market, Limuru Road, Nairobi',
    '+254709848000', '+254709848000', 'https://www.tribe-hotel.com/wellness', 6500, 'From KSh 6,500',
    ARRAY['Hydrotherapy', 'Couples Massage', 'Body Scrubs', 'Sauna', 'Luxury Spa'],
    ARRAY['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&fit=crop', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'wellness', 'Entim Sidai Sanctuary & Forest Spa', 'entim-sidai-forest-spa-karen',
    'Eco-Luxury Forest Spa Overlooking the Majestic Ngong Hills',
    'Set in 20 acres of indigenous Karura-type forest in Karen, Entim Sidai offers tranquil wellness retreats, reflexology, herbal body wraps, and outdoor spa massages immersed in bird song and native tree breezes.',
    'Nairobi', 'Karen', 'Tree Lane, off Ngong Road, Karen, Nairobi',
    '+254704870020', '+254704870020', 'https://www.entimsidai.com', 5000, 'From KSh 5,000',
    ARRAY['Forest Spa', 'Nature Wellness', 'Reflexology', 'Herbal Wraps', 'Karen Retreat'],
    ARRAY['https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&fit=crop', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'wellness', 'Tulia Wellness Spa - Sarova Whitesands', 'tulia-spa-sarova-whitesands',
    'Beachfront Ayurvedic & Marine Spa Therapies in Mombasa',
    'Experience oceanfront rejuvenation with Ayurvedic body oils, marine algae wraps, and deep tension release while listening to the Indian Ocean waves on Bamburi Beach.',
    'Mombasa', 'Nyali', 'Malindi Road, Bamburi Beach, Mombasa',
    '+254709111000', '+254709111000', 'https://www.sarovahotels.com/whitesands-mombasa/wellness', 4000, 'From KSh 4,000',
    ARRAY['Ocean Spa', 'Ayurveda', 'Mombasa Wellness', 'Beach Massage', 'Body Polishing'],
    ARRAY['https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&fit=crop', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    headline = EXCLUDED.headline,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    is_manual = true,
    is_verified = true,
    is_published = true,
    updated_at = NOW();

  -- ============================================================================
  -- 3. DIRECTORY PROFILES: SALONS & BEAUTY (kind = 'salon')
  -- ============================================================================
  INSERT INTO public.directory_profiles (
    id, user_id, kind, name, slug, headline, description, county, town, location_name,
    phone, whatsapp, website, price, price_label, tags, images, avatar_url,
    is_verified, is_featured, is_published, is_manual, created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(), v_admin_id, 'salon', 'Rapunzel Hair Affair Nairobi', 'rapunzel-hair-affair-nairobi',
    'Specialist Hair Weaves, Silk Press, Braiding & Luxury Extensions',
    'Rapunzel Hair Affair is one of Nairobi premier hair destinations. Renowned for flawless lace melting, human hair weave installations, precision cutting, and knotless braids in a comfortable executive lounge.',
    'Nairobi', 'Kilimani', 'Adams Arcade, Ngong Road, Nairobi',
    '+254722830800', '+254722830800', 'https://www.rapunzelhairaffair.com', 2500, 'From KSh 2,500',
    ARRAY['Silk Press', 'Knotless Braids', 'Human Hair', 'Lace Frontals', 'Bridal Styling'],
    ARRAY['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&fit=crop', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'salon', 'Castles Hair & Beauty Lounge', 'castles-hair-beauty-kilimani',
    'Bespoke Hair Colouring, Keratin Treatments & Gel Nail Studio',
    'Modern full-service salon in Kilimani catering to contemporary styling, scalp rejuvenation, balayage hair colouring, and acrylic gel manicures by certified cosmetologists.',
    'Nairobi', 'Kilimani', 'Wood Avenue, Kilimani, Nairobi',
    '+254714500500', '+254714500500', 'https://www.castleshairandbeauty.co.ke', 3000, 'From KSh 3,000',
    ARRAY['Nail Art', 'Balayage', 'Keratin Smoothing', 'Pedicure', 'Kilimani Salon'],
    ARRAY['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&fit=crop', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'salon', 'Afro Siri Natural Hair Salon', 'afro-siri-salon-westlands',
    'Dedicated Natural Afro Care, Sisterlocks, Locs & Protective Styling',
    'Kenya renowned studio dedicated to the celebration and nurturing of natural afro hair. Expert locticians offering interlocking, detox washes, silk presses, cornrows, and organic hair masks.',
    'Nairobi', 'Westlands', 'Kenrail Towers, Ring Road Parklands, Westlands',
    '+254718844717', '+254718844717', 'https://www.afrosiri.co.ke', 2000, 'From KSh 2,000',
    ARRAY['Natural Hair', 'Sisterlocks', 'Dreadlocks', 'Organic Care', 'Westlands Salon'],
    ARRAY['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'salon', 'Ashley Hair & Beauty Academy', 'ashleys-hair-beauty-cbd',
    'Executive Haircuts, Blow-Drys, Facials & Bridal Glamour in Nairobi CBD',
    'Nairobi flagship branch of Ashley Hair & Beauty, delivering world-standard hairstyling, revitalising facials, barber grooming, and bridal packages with over 20 years of brand excellence.',
    'Nairobi', 'CBD', 'Lyric House, Kimathi Street, Nairobi CBD',
    '+254722206540', '+254722206540', 'https://www.ashleyskenya.com', 2500, 'From KSh 2,500',
    ARRAY['Executive Barber', 'Bridal Glam', 'Haircut', 'Facials', 'CBD Salon'],
    ARRAY['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    headline = EXCLUDED.headline,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    is_manual = true,
    is_verified = true,
    is_published = true,
    updated_at = NOW();

  -- ============================================================================
  -- 4. DIRECTORY PROFILES: RESTAURANTS & DINING (kind = 'restaurant')
  -- ============================================================================
  INSERT INTO public.directory_profiles (
    id, user_id, kind, name, slug, headline, description, county, town, location_name,
    phone, whatsapp, website, price, price_label, tags, images, avatar_url,
    is_verified, is_featured, is_published, is_manual, created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(), v_admin_id, 'restaurant', 'The Talisman Restaurant', 'the-talisman-restaurant-karen',
    'Gastronomic Garden Dining with Pan-Asian, European & African Flavours',
    'Consistently voted one of Kenya best restaurants, The Talisman features warm carved wooden interiors, lush outdoor gardens, artisanal cocktails, feta and coriander samosas, and fresh sushi in Karen.',
    'Nairobi', 'Karen', '320 Ngong Road, Karen, Nairobi',
    '+254705999997', '+254705999997', 'https://www.thetalismanrestaurant.com', 2800, 'Avg KSh 2,800/person',
    ARRAY['Fine Dining', 'Garden Seating', 'Sushi', 'Cocktails', 'Karen Dining'],
    ARRAY['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&fit=crop', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'restaurant', 'INTI - A Nikkei Experience', 'inti-nikkei-experience-westlands',
    'Skyline Views & Japanese-Peruvian Cuisine on Waiyaki Way',
    'Perched on the 20th floor of One Africa Place in Westlands, INTI delivers panoramic Nairobi skyline vistas alongside authentic Nikkei gastronomy: ceviches, robata grilled skewers, and signature sushi platters.',
    'Nairobi', 'Westlands', '20th Floor, One Africa Place, Waiyaki Way, Nairobi',
    '+254735065945', '+254735065945', 'https://www.theintiexperience.com', 4000, 'Avg KSh 4,000/person',
    ARRAY['Rooftop', 'Nikkei Cuisine', 'Westlands', 'Cocktail Lounge', 'Romantic Dinner'],
    ARRAY['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&fit=crop', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'restaurant', 'Tamarind Restaurant & Dhow Mombasa', 'tamarind-restaurant-mombasa',
    'Legendary Oceanfront Seafood & Dhow Dinner Cruises in Nyali',
    'Overlooking the Old Port of Mombasa, Tamarind is East Africa foremost seafood destination. Feast on mangrove crab, grilled lobster, and ginger-infused prawns, or sail on the famous Tamarind Dhow.',
    'Mombasa', 'Nyali', 'Silversands, Nyali, Mombasa',
    '+254722205160', '+254722205160', 'https://www.tamarind.co.ke/tamarind-mombasa', 3500, 'Avg KSh 3,500/person',
    ARRAY['Seafood', 'Ocean View', 'Dhow Cruise', 'Mombasa Dining', 'Lobster & Crab'],
    ARRAY['https://images.unsplash.com/photo-1544025162-d76694265947?w=800&fit=crop', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'restaurant', 'CJ Restaurant & Cafe', 'cjs-restaurant-koinange-nairobi',
    'All-Day Casual Gourmet Dining, Fresh Bakery & Specialty Coffees',
    'Kenya beloved all-day dining brand boasting over 300 crafted menu items. Enjoy hearty breakfasts, artisanal burgers, grilled steaks, fresh juices, and signature iced teas in an inviting, contemporary atmosphere.',
    'Nairobi', 'CBD', 'Koinange Street, CBD, Nairobi',
    '+254792000090', '+254792000090', 'https://www.cjs.co.ke', 1800, 'Avg KSh 1,800/person',
    ARRAY['Casual Dining', 'Specialty Coffee', 'Breakfast', 'Burgers', 'Family Friendly'],
    ARRAY['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    headline = EXCLUDED.headline,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    is_manual = true,
    is_verified = true,
    is_published = true,
    updated_at = NOW();

  -- ============================================================================
  -- 5. DIRECTORY PROFILES: CAREER & JOBS (kind = 'job')
  -- ============================================================================
  INSERT INTO public.directory_profiles (
    id, user_id, kind, name, slug, headline, description, county, town, location_name,
    phone, whatsapp, website, price, price_label, tags, images, avatar_url,
    is_verified, is_featured, is_published, is_manual, created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(), v_admin_id, 'job', 'Senior Financial Accountant - FMCG Kenya', 'senior-financial-accountant-nairobi',
    'CPA(K) Qualified Accountant | KSh 120,000 - 160,000 / Month',
    'Leading FMCG distribution corporate is hiring a Senior Financial Accountant. Responsibilities include financial reporting, KRA VAT & PAYE statutory compliance, treasury management, and audit coordination.',
    'Nairobi', 'Industrial Area', 'Enterprise Road, Industrial Area, Nairobi',
    '+254711000111', '+254711000111', 'https://www.kenyaadverts.com/jobs', 140000, 'KSh 120K - 160K / mo',
    ARRAY['Accounting', 'CPA-K', 'Finance Lead', 'Tax Compliance', 'Full Time'],
    ARRAY['https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'job', 'Full-Stack Software Engineer (React & Node)', 'fullstack-software-engineer-kilimani',
    'TypeScript, React, Node.js & Supabase | KSh 150,000 - 220,000',
    'Vibrant Nairobi FinTech scale-up is seeking a talented Full-Stack Engineer with solid experience in TypeScript, React, Node.js, and PostgreSQL. Hybrid working arrangements with flexible hours.',
    'Nairobi', 'Kilimani', 'Wood Avenue, Kilimani, Nairobi',
    '+254722000222', '+254722000222', 'https://www.kenyaadverts.com/jobs', 180000, 'KSh 150K - 220K / mo',
    ARRAY['Software Developer', 'React', 'Node.js', 'FinTech', 'Hybrid Work'],
    ARRAY['https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'job', 'Digital Marketing & Growth Lead', 'digital-marketing-growth-lead-westlands',
    'Google Ads, TikTok & Meta Performance Marketing | KSh 100,000 - 130,000',
    'High-growth Kenyan brand seeks a proactive Performance Marketing Specialist to scale paid media acquisition, SEO, and email marketing funnels. Competitive base salary with performance bonuses.',
    'Nairobi', 'Westlands', 'Westlands Commercial Centre, Nairobi',
    '+254733000333', '+254733000333', 'https://www.kenyaadverts.com/jobs', 110000, 'KSh 100K - 130K / mo',
    ARRAY['Digital Marketing', 'SEO', 'Paid Ads', 'Social Media', 'Full Time'],
    ARRAY['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'job', 'Supply Chain & Port Logistics Coordinator', 'supply-chain-logistics-coordinator-mombasa',
    'KRA Simba & Bonded Warehousing Specialist | KSh 85,000 - 110,000',
    'Established freight forwarding logistics firm is recruiting a Port Logistics Coordinator to manage customs clearance, container terminal logistics, and transit documentation at Kilindini Harbour Mombasa.',
    'Mombasa', 'CBD', 'Moi Avenue, Port Area, Mombasa',
    '+254722000444', '+254722000444', 'https://www.kenyaadverts.com/jobs', 95000, 'KSh 85K - 110K / mo',
    ARRAY['Logistics', 'Clearing & Forwarding', 'Mombasa Port', 'Supply Chain', 'Full Time'],
    ARRAY['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    headline = EXCLUDED.headline,
    description = EXCLUDED.description,
    is_manual = true,
    is_verified = true,
    is_published = true,
    updated_at = NOW();

  -- ============================================================================
  -- 6. DIRECTORY PROFILES: HOTELS & TOURS (kind = 'hotel', 'tour')
  -- ============================================================================
  INSERT INTO public.directory_profiles (
    id, user_id, kind, name, slug, headline, description, county, town, location_name,
    phone, whatsapp, website, price, price_label, tags, images, avatar_url,
    is_verified, is_featured, is_published, is_manual, created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(), v_admin_id, 'hotel', 'Giraffe Manor Langata', 'giraffe-manor-langata-nairobi',
    'Iconic Boutique Manor Where Giraffes Join You for Breakfast',
    'World-renowned boutique hotel set in 12 acres of private land within 140 acres of indigenous forest in Langata. Enjoy timeless elegance, manicured sunny lawns, and up-close encounters with the resident Rothschild giraffe herd.',
    'Nairobi', 'Karen', 'Gogo Falls Road, Langata, Nairobi',
    '+254734500220', '+254734500220', 'https://www.thesafaricollection.com/properties/giraffe-manor', 95000, 'From KSh 95,000/night',
    ARRAY['Boutique Hotel', 'Giraffe Encounter', 'Luxury Safari', 'Karen', 'Langata'],
    ARRAY['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'hotel', 'Sarova Mara Game Camp', 'sarova-mara-game-camp',
    'Luxury Tented Haven in the Heart of the Maasai Mara Migration',
    'Nestled in the prime game corridor of the Maasai Mara, Sarova Mara features deluxe tented chalets, organic vegetable gardens, a free-form swimming pool, and scenic bush dining underneath acacia trees.',
    'Narok', 'Maasai Mara', 'Sekenani Gate, Maasai Mara Reserve',
    '+254709111000', '+254709111000', 'https://www.sarovahotels.com/maracamp-masai-mara', 32000, 'From KSh 32,000/night',
    ARRAY['Safari Lodge', 'Maasai Mara', 'Big Five', 'Game Drives', 'Luxury Camping'],
    ARRAY['https://images.unsplash.com/photo-1549366021-9f761d450615?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1549366021-9f761d450615?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'tour', '3-Day Maasai Mara Big Five Safari Package', '3-day-maasai-mara-big-five-safari',
    'All-Inclusive 4x4 Land Cruiser Game Drives, Park Fees & Full-Board Lodge',
    'Embark on Kenya premier wildlife safari. Daily departures from Nairobi in luxury 4x4 pop-up roof safari Land Cruisers, expert KPSGA gold-certified guides, tracking lions, cheetahs, elephants, and leopards across the savannah.',
    'Nairobi', 'Westlands', 'Nairobi Hotel Pickups / Departures',
    v_phone, v_wa, 'https://www.kenyaadverts.com/tours', 38000, 'KSh 38,000 / person',
    ARRAY['Maasai Mara', '4x4 Safari', 'Wildlife Tour', 'Big Five', 'Full Board'],
    ARRAY['https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&fit=crop'],
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=200&fit=crop',
    true, true, true, true, NOW(), NOW()
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    headline = EXCLUDED.headline,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    is_manual = true,
    is_verified = true,
    is_published = true,
    updated_at = NOW();

  -- ============================================================================
  -- 7. EVENTS (table = 'events')
  -- ============================================================================
  INSERT INTO public.events (
    id, user_id, title, slug, description, category, location,
    start_at, end_at, ticket_price, is_paid, external_tickets_link, cover_image, host_name,
    is_published, is_listed, created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(), v_admin_id, 'Kenya Tech & AI Summit 2026', 'kenya-tech-ai-summit-2026',
    'East Africa premier technology convention bringing together AI developers, founders, telecom executives, and angel investors to discuss African artificial intelligence and digital infrastructure.',
    'Technology & Innovation', 'Sarit Expo Centre, Westlands, Nairobi',
    '2026-10-15T09:00:00Z', '2026-10-16T17:30:00Z', 0, false, 'https://www.kenyatechsummit.co.ke',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&fit=crop', 'Silicon Savannah Network',
    true, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'Nairobi International Food & Wine Festival', 'nairobi-food-wine-festival-2026',
    'An extraordinary weekend celebrating Kenya culinary excellence with 40+ leading restaurants, international wine tastings, mixology masterclasses, and live acoustic music.',
    'Food & Culture', 'KICC Courtyard, Harambee Avenue, Nairobi',
    '2026-10-24T11:00:00Z', '2026-10-25T21:00:00Z', 1500, true, 'https://www.nairobiexpo.co.ke/food',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&fit=crop', 'Gourmet Kenya Events',
    true, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'East Africa Solar & Renewable Energy Expo', 'east-africa-solar-energy-expo-2026',
    'Connect with solar panel manufacturers, inverter suppliers, and clean-tech financiers for residential and commercial solar installations across Kenya and East Africa.',
    'Business & Trade', 'Radisson Blu Hotel, Upper Hill, Nairobi',
    '2026-11-06T08:30:00Z', '2026-11-07T16:00:00Z', 2500, true, 'https://www.energykenya.org',
    'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1000&fit=crop', 'Renewable Energy Kenya Association',
    true, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'Safari Sevens Rugby Tournament 2026', 'safari-sevens-rugby-2026',
    'Africa premier international rugby sevens fiesta returning with electrifying rugby action, live entertainment, village food court, and party vibes at RFUEA Grounds.',
    'Sports & Fitness', 'RFUEA Grounds, Ngong Road, Nairobi',
    '2026-11-14T09:00:00Z', '2026-11-15T20:00:00Z', 1000, true, 'https://www.kru.co.ke/safari-sevens',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1000&fit=crop', 'Kenya Rugby Union',
    true, true, NOW(), NOW()
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    location = EXCLUDED.location,
    ticket_price = EXCLUDED.ticket_price,
    is_paid = EXCLUDED.is_paid,
    cover_image = EXCLUDED.cover_image,
    is_published = true,
    is_listed = true,
    updated_at = NOW();

  -- ============================================================================
  -- 8. DIGITAL PRODUCTS (table = 'digital_products')
  -- Note: categories match DigitalStorePage pills ('Templates', 'Software', 'E-books', 'Courses')
  -- ============================================================================
  INSERT INTO public.digital_products (
    id, created_by, title, slug, short_description, description, price, currency, category,
    seller_name, seller_contact, delivery_type, delivery_content, images,
    is_published, is_featured, is_verified_seller, approval_status, created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(), v_admin_id, 'Kenya Business Plan & 5-Year Financial Model Template', 'kenya-business-plan-financial-model-template',
    'Bank-approved investor business plan template customized for Kenya Commercial Bank, Equity Bank, and SME funding.',
    'Complete Word business plan template with pre-built market analysis for Kenya, plus an automated Excel 5-year financial model with cash flow projections, break-even analysis, and income statements.',
    1499, 'KES', 'Templates', 'KenyaAdvert Digital Hub', v_phone,
    'download', 'https://www.kenyaadverts.com/downloads/kenya-business-plan-template.zip',
    ARRAY['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&fit=crop'],
    true, true, true, 'approved', NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'Kenya HR Toolkit: Employment Contracts & Policies 2026', 'kenya-hr-employment-contracts-toolkit',
    'Legally vetted employment contracts, NDA agreements, and employee handbook compliant with the Kenya Employment Act.',
    'Includes permanent staff contracts, casual labour agreements, independent contractor NDAs, disciplinary procedures, and leave policy documents reviewed by corporate labour advocates in Nairobi.',
    999, 'KES', 'Templates', 'LegalKenya Docs', v_phone,
    'download', 'https://www.kenyaadverts.com/downloads/kenya-hr-toolkit-2026.zip',
    ARRAY['https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&fit=crop'],
    true, true, true, 'approved', NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'Safaricom M-Pesa Daraja API Integration Kit (Node.js & Python)', 'daraja-mpesa-api-integration-boilerplate',
    'Production-grade M-Pesa STK Push, B2C, and C2B transaction processing boilerplate with webhook verification.',
    'Stop wasting hours on Daraja auth tokens and callback handling. Includes copy-paste ready Express.js and FastAPI starter templates, webhook signature verification, and automated transaction reconciliation.',
    1999, 'KES', 'Software', 'DevKenya Tech', v_phone,
    'download', 'https://www.kenyaadverts.com/downloads/daraja-mpesa-starter-kit.zip',
    ARRAY['https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=800&fit=crop'],
    true, true, true, 'approved', NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'Kenya Land Buying Due Diligence & Search Handbook', 'kenya-land-buying-due-diligence-guide',
    'Essential practical guide to verify title deeds, search ArdhiSasa, avoid land scams, and calculate land transfer costs.',
    'Covers title verification on ArdhiSasa, green card registry inspection, beacon surveying, Land Control Board consent, stamp duty computation, and standard sale agreement contracts.',
    799, 'KES', 'E-books', 'Kenya Property Advisory', v_phone,
    'download', 'https://www.kenyaadverts.com/downloads/kenya-land-buying-handbook.pdf',
    ARRAY['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&fit=crop'],
    true, true, true, 'approved', NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id, 'Kenya E-Commerce & WhatsApp Selling Masterclass', 'kenya-ecommerce-whatsapp-selling-course',
    'Actionable blueprint to launch, market, and scale high-converting products via WhatsApp Business, Meta & TikTok in Kenya.',
    'Covers supplier sourcing in Nairobi, parcel dispatch with Fargo Courier and Speedaf, payment collection via Paybill/Till, and automated customer service workflows.',
    1299, 'KES', 'Courses', 'Kenya Digital Academy', v_phone,
    'download', 'https://www.kenyaadverts.com/downloads/kenya-ecommerce-masterclass.zip',
    ARRAY['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&fit=crop'],
    true, true, true, 'approved', NOW(), NOW()
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category = EXCLUDED.category,
    is_published = true,
    approval_status = 'approved',
    is_verified_seller = true,
    updated_at = NOW();

  -- ============================================================================
  -- 9. CLASSIFIEDS ADS ACROSS MAIN CATEGORIES (table = 'ads')
  -- ============================================================================
  -- Ensure unique index exists on ads slug for idempotency
  CREATE UNIQUE INDEX IF NOT EXISTS ads_slug_unique ON public.ads (slug) WHERE slug IS NOT NULL;

  -- 9.1 VEHICLES
  INSERT INTO public.ads (
    id, user_id, title, slug, description, category_id, subcategory_id,
    price, condition, county, town, phone, whatsapp, badge, status, is_listed, ai_generated, images, created_at, updated_at
  ) VALUES
  (
    gen_random_uuid(), v_admin_id,
    'Toyota Land Cruiser Prado TX-L 2018 Pearl White (Sunroof, 7-Seater, Diesel)',
    'toyota-prado-tx-l-2018-pearl-white-nairobi',
    'Immaculate condition Toyota Land Cruiser Prado TX-L 2018 in stunning Pearl White. 2800cc 1GD Turbo Diesel engine, 7-seater black leather interior, original sunroof, 360-degree cameras, multi-terrain select, 18-inch alloy wheels. Fully serviced by Toyota Kenya with genuine low mileage. Clean logbook ready for transfer.',
    v_cat_vehicles, v_subcat_cars,
    6450000, 'Used', 'Nairobi', 'Westlands', v_phone, v_wa, 'gold', 'active', true, false,
    ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&fit=crop', 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&fit=crop'],
    NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id,
    'Mazda Demio 2017 SkyActiv 1300cc Metallic Blue (Low Mileage, 1st Owner)',
    'mazda-demio-2017-skyactiv-metallic-blue-mombasa',
    'Very clean Mazda Demio 2017 SkyActiv in Metallic Blue. Super fuel-efficient 1300cc engine, automatic transmission, push-to-start, lane departure alert, reverse camera, clean fabric interior. Excellent daily commuter for Mombasa or Nairobi traffic.',
    v_cat_vehicles, v_subcat_cars,
    1180000, 'Used', 'Mombasa', 'Nyali', v_phone, v_wa, 'silver', 'active', true, false,
    ARRAY['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&fit=crop'],
    NOW(), NOW()
  ),

  -- 9.2 ELECTRONICS
  (
    gen_random_uuid(), v_admin_id,
    'Apple iPhone 15 Pro Max 256GB Natural Titanium (Battery Health 100%, Sealed/Mint)',
    'iphone-15-pro-max-256gb-natural-titanium-nairobi',
    'Genuine Apple iPhone 15 Pro Max 256GB in Natural Titanium. Unlocked for Safaricom and Airtel, pristine condition with 100% battery health. Comes with original Apple USB-C braided cable, box, and 6-month store warranty. Receipt provided.',
    v_cat_electronics, v_subcat_phones,
    148000, 'Refurbished', 'Nairobi', 'CBD', v_phone, v_wa, 'gold', 'active', true, false,
    ARRAY['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&fit=crop', 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&fit=crop'],
    NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id,
    'HP EliteBook 840 G8 Intel Core i7 11th Gen 16GB RAM 512GB SSD FHD Backlit',
    'hp-elitebook-840-g8-core-i7-16gb-512gb-nairobi',
    'High-performance executive laptop HP EliteBook 840 G8. Intel Core i7 11th Gen processor, 16GB DDR4 RAM, 512GB NVMe M.2 SSD, 14.0-inch Full HD Anti-glare screen, fingerprint reader, backlit keyboard, long-lasting battery. Ideal for programmers, accountants, and executives.',
    v_cat_electronics, v_subcat_laptops,
    62000, 'Used', 'Nairobi', 'Westlands', v_phone, v_wa, 'silver', 'active', true, false,
    ARRAY['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&fit=crop'],
    NOW(), NOW()
  ),

  -- 9.3 PROPERTY RENTALS & SALES
  (
    gen_random_uuid(), v_admin_id,
    'Modern 2-Bedroom Master Ensuite Apartment with Balcony & High-Speed Lifts',
    'modern-2-bedroom-apartment-kilimani-nairobi',
    'Spacious, brand-new 2-bedroom apartment with master ensuite in Kilimani. Features expansive living area opening to scenic balcony, open-plan granite kitchen with pantry, borehole water, full backup generator, high-speed elevators, CCTV surveillance, and 24/7 manned security gate.',
    v_cat_property, v_subcat_rent,
    65000, 'New', 'Nairobi', 'Kilimani', v_phone, v_wa, 'gold', 'active', true, false,
    ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&fit=crop'],
    NOW(), NOW()
  ),
  (
    gen_random_uuid(), v_admin_id,
    'Prime 50x100 (1/8th Acre) Residential Plot with Ready Title Deed in Joska',
    'prime-50x100-residential-plot-joska-kangundo-road',
    'Fast-developing residential plot measuring 50 by 100 feet located in Joska, just 1.5km from Kangundo Road tarmac. Flat red soil, electricity and water available on-site, perimeter fenced neighbourhood. Ready freehold title deed transferred directly to buyer.',
    v_cat_property, v_subcat_land,
    950000, 'New', 'Machakos', 'Joska', v_phone, v_wa, 'silver', 'active', true, false,
    ARRAY['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&fit=crop'],
    NOW(), NOW()
  ),

  -- 9.4 FARMING & AGRICULTURE
  (
    gen_random_uuid(), v_admin_id,
    'High-Yielding Holstein Friesian In-Calf Dairy Heifers (Pedigree Certified)',
    'holstein-friesian-in-calf-dairy-heifers-limuru',
    'Purebred Holstein Friesian dairy heifers in 6th month pregnancy by top American World Wide Sires semen. Vaccinated against East Coast Fever, Anthrax, and Foot-and-Mouth disease. Expected milk production 28-35 litres daily. Located on farm in Limuru with veterinary health records.',
    v_cat_farming, null,
    165000, 'New', 'Kiambu', 'Limuru', v_phone, v_wa, 'gold', 'active', true, false,
    ARRAY['https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=800&fit=crop'],
    NOW(), NOW()
  ),

  -- 9.5 SERVICES
  (
    gen_random_uuid(), v_admin_id,
    'Professional Home & Office Moving Services across Kenya (Packing & Transit Insurance)',
    'professional-home-office-moving-relocation-nairobi',
    'Stress-free relocation for apartments, maisonettes, and corporate offices in Nairobi and countrywide. We provide heavy-duty carton boxes, bubble wrap for delicate electronics, furniture disassembling and reassembly, and enclosed padded trucks.',
    v_cat_services, null,
    15000, 'New', 'Nairobi', 'Westlands', v_phone, v_wa, 'silver', 'active', true, false,
    ARRAY['https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=800&fit=crop'],
    NOW(), NOW()
  )
  ON CONFLICT (slug) WHERE slug IS NOT NULL DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    status = 'active',
    is_listed = true,
    ai_generated = false,
    images = EXCLUDED.images,
    updated_at = NOW();

  RAISE NOTICE 'Curated content across all categories successfully published for admin %', v_admin_id;
END $$;
