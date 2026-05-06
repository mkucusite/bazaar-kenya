ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS gallery_images text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.banner_campaigns
ADD COLUMN IF NOT EXISTS gallery_images text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_events_user_created ON public.events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_banner_campaigns_user_created ON public.banner_campaigns (user_id, created_at DESC);