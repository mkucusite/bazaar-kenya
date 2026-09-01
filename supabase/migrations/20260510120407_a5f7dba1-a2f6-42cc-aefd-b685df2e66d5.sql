
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
