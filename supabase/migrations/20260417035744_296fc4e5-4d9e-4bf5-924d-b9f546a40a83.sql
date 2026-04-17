
-- Allow anonymous reviews & nested replies
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;

-- Drop strict insert policy and re-create permissive one
DROP POLICY IF EXISTS "Auth insert" ON public.reviews;

CREATE POLICY "Anyone can insert reviews"
ON public.reviews
FOR INSERT
TO public
WITH CHECK (
  -- Authenticated users must own user_id; guests must use null user_id and provide name
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR (auth.uid() IS NULL AND user_id IS NULL AND guest_name IS NOT NULL AND length(trim(guest_name)) > 0)
);

CREATE INDEX IF NOT EXISTS reviews_parent_id_idx ON public.reviews(parent_id);
CREATE INDEX IF NOT EXISTS reviews_ad_id_idx ON public.reviews(ad_id);
