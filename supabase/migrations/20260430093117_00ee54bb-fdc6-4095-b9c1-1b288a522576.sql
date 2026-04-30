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