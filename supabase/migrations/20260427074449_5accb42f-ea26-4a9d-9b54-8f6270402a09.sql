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
