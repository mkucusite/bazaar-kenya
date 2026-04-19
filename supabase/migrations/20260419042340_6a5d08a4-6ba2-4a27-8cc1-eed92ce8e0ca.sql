-- Fix: ad_code generation was using gen_random_bytes() which requires pgcrypto.
-- Switch to using gen_random_uuid() (built-in) for entropy instead.

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
    -- Use uuid-based entropy (built-in, no extension needed)
    candidate := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 7));
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