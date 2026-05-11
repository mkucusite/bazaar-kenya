ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS banner_id uuid;

CREATE INDEX IF NOT EXISTS idx_payments_banner_id ON public.payments (banner_id);