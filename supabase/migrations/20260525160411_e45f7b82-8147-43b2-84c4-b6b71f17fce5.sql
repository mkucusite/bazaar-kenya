
-- Add boost columns to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS promotion_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promoted_until timestamptz;

CREATE INDEX IF NOT EXISTS idx_events_promoted_until ON public.events (promoted_until DESC NULLS LAST);

-- Link payments to events
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS event_id uuid;

CREATE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments (event_id);

-- RPC to apply an event promotion after successful payment
CREATE OR REPLACE FUNCTION public.apply_event_promotion(target_event_id uuid, paid_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF paid_amount < 500 THEN
    RAISE EXCEPTION 'Minimum event boost amount is KSh 500';
  END IF;

  UPDATE public.events
  SET promotion_amount = COALESCE(promotion_amount, 0) + paid_amount,
      promoted_until = GREATEST(COALESCE(promoted_until, now()), now()) + INTERVAL '30 days',
      updated_at = now()
  WHERE id = target_event_id;
END;
$$;
