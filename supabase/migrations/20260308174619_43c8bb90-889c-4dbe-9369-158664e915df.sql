-- Add slug column to ads
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index on slug (partial, only for non-null slugs)
CREATE UNIQUE INDEX IF NOT EXISTS ads_slug_unique ON public.ads (slug) WHERE slug IS NOT NULL;

-- Function to generate a unique slug from title
CREATE OR REPLACE FUNCTION public.generate_ad_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  -- Only generate if slug is null or title changed
  IF NEW.slug IS NOT NULL AND (TG_OP = 'UPDATE' AND OLD.title = NEW.title) THEN
    RETURN NEW;
  END IF;

  -- Generate base slug from title
  base_slug := lower(NEW.title);
  base_slug := translate(base_slug, 'àáâãäåèéêëìíîïòóôõöùúûüýÿñ', 'aaaaaaeeeeiiiioooooouuuuyyn');
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := trim(base_slug);
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := left(base_slug, 80);

  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'listing';
  END IF;

  -- Try the base slug first, then append counter for uniqueness
  final_slug := base_slug;
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.ads WHERE slug = final_slug AND id != NEW.id) THEN
      EXIT;
    END IF;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS tr_generate_ad_slug ON public.ads;
CREATE TRIGGER tr_generate_ad_slug
  BEFORE INSERT OR UPDATE ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_ad_slug();

-- Backfill slugs for all existing ads (trigger fires on update)
UPDATE public.ads SET slug = NULL WHERE slug IS NULL;