ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS external_tickets_link text;