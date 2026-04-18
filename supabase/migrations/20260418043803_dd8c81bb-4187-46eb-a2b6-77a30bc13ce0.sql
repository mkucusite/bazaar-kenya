-- Add JSONB attributes for category-specific fields
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Add a short human-readable ad code (e.g. "A7K9X2M")
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS ad_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS ads_ad_code_key ON public.ads (ad_code) WHERE ad_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS ads_attributes_gin ON public.ads USING GIN (attributes);

-- Function to generate a short ad code
CREATE OR REPLACE FUNCTION public.generate_ad_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate TEXT;
  attempts INT := 0;
BEGIN
  IF NEW.ad_code IS NOT NULL AND length(NEW.ad_code) > 0 THEN
    RETURN NEW;
  END IF;
  LOOP
    candidate := upper(substring(replace(encode(gen_random_bytes(6), 'base64'), '/', '0') from 1 for 7));
    candidate := regexp_replace(candidate, '[^A-Z0-9]', 'X', 'g');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.ads WHERE ad_code = candidate);
    attempts := attempts + 1;
    IF attempts > 10 THEN
      candidate := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 7));
      EXIT;
    END IF;
  END LOOP;
  NEW.ad_code := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_ad_code ON public.ads;
CREATE TRIGGER set_ad_code
  BEFORE INSERT ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_ad_code();

-- Backfill existing ads
UPDATE public.ads
SET ad_code = upper(substring(md5(id::text) from 1 for 7))
WHERE ad_code IS NULL;