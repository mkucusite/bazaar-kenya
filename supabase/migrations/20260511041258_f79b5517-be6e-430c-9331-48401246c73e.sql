ALTER TABLE public.banner_campaigns
  ADD COLUMN IF NOT EXISTS promotion_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promoted_until timestamp with time zone;

ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.banner_campaigns
  ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_banner_campaigns_promotion_rank
  ON public.banner_campaigns (promoted_until DESC, promotion_amount DESC, created_at DESC)
  WHERE status = 'active' AND is_hidden_by_report = false;

CREATE OR REPLACE FUNCTION public.hide_ad_on_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ads
  SET is_hidden_by_report = true,
      report_count = COALESCE(report_count, 0) + 1,
      updated_at = now()
  WHERE id = NEW.ad_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.hide_event_on_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.events
  SET is_hidden_by_report = true,
      report_count = COALESCE(report_count, 0) + 1,
      updated_at = now()
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.hide_banner_on_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.banner_campaigns
  SET is_hidden_by_report = true,
      report_count = COALESCE(report_count, 0) + 1,
      updated_at = now()
  WHERE id = NEW.banner_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_banner_promotion(target_banner_id uuid, paid_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF paid_amount < 5000 THEN
    RAISE EXCEPTION 'Minimum promotion amount is KSh 5,000';
  END IF;

  UPDATE public.banner_campaigns
  SET promotion_amount = COALESCE(promotion_amount, 0) + paid_amount,
      promoted_until = GREATEST(COALESCE(promoted_until, now()), now()) + interval '30 days',
      updated_at = now()
  WHERE id = target_banner_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_banner_promotion(uuid, numeric) TO service_role;