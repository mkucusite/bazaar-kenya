
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
