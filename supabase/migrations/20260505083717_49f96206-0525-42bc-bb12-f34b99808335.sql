ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_event_views(target_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.events
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = target_event_id
    AND is_published = true;
END;
$function$;