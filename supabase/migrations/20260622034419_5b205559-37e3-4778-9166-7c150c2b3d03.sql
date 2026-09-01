-- Clear duplicate / generic Unsplash photos from AI-generated ads so the
-- placeholder shows instead. The cron will gradually re-generate proper
-- AI images to replace them.
UPDATE public.ads
SET images = '{}'
WHERE images::text LIKE '%images.unsplash.com%';
