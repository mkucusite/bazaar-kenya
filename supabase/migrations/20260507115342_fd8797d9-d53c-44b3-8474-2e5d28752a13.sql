ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_listed boolean NOT NULL DEFAULT true;
ALTER TABLE public.banner_campaigns ADD COLUMN IF NOT EXISTS is_listed boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_events_is_listed ON public.events(is_listed);
CREATE INDEX IF NOT EXISTS idx_banner_campaigns_is_listed ON public.banner_campaigns(is_listed);