
-- 1. Update banner slug generator: strip digits, use letter-only suffix on collision
CREATE OR REPLACE FUNCTION public.generate_banner_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  suffix text;
  letters text := 'abcdefghijklmnopqrstuvwxyz';
  i int;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;
  base_slug := lower(coalesce(NEW.business_name, 'banner'));
  -- strip digits and special chars
  base_slug := regexp_replace(base_slug, '[0-9]', '', 'g');
  base_slug := regexp_replace(base_slug, '[^a-z\s-]', '', 'g');
  base_slug := trim(base_slug);
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := left(base_slug, 80);
  IF base_slug IS NULL OR base_slug = '' THEN base_slug := 'banner'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.banner_campaigns WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    suffix := '';
    FOR i IN 1..5 LOOP
      suffix := suffix || substr(letters, 1 + floor(random() * 26)::int, 1);
    END LOOP;
    final_slug := base_slug || '-' || suffix;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$function$;

-- 2. Same for events
CREATE OR REPLACE FUNCTION public.generate_event_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  suffix text;
  letters text := 'abcdefghijklmnopqrstuvwxyz';
  i int;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;
  base_slug := lower(coalesce(NEW.title, 'event'));
  base_slug := regexp_replace(base_slug, '[0-9]', '', 'g');
  base_slug := regexp_replace(base_slug, '[^a-z\s-]', '', 'g');
  base_slug := trim(base_slug);
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := left(base_slug, 80);
  IF base_slug IS NULL OR base_slug = '' THEN base_slug := 'event'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    suffix := '';
    FOR i IN 1..5 LOOP
      suffix := suffix || substr(letters, 1 + floor(random() * 26)::int, 1);
    END LOOP;
    final_slug := base_slug || '-' || suffix;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$function$;

-- 3. Ensure triggers exist (they may not have been created)
DROP TRIGGER IF EXISTS trg_generate_banner_slug ON public.banner_campaigns;
CREATE TRIGGER trg_generate_banner_slug
BEFORE INSERT OR UPDATE ON public.banner_campaigns
FOR EACH ROW EXECUTE FUNCTION public.generate_banner_slug();

DROP TRIGGER IF EXISTS trg_generate_event_slug ON public.events;
CREATE TRIGGER trg_generate_event_slug
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.generate_event_slug();

-- 4. Backfill existing banner_campaigns with NULL slugs
UPDATE public.banner_campaigns SET slug = NULL WHERE slug = '';
-- Trigger an update to fire the slug generator for rows with null slug
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.banner_campaigns WHERE slug IS NULL LOOP
    UPDATE public.banner_campaigns SET business_name = business_name WHERE id = r.id;
  END LOOP;
END $$;
