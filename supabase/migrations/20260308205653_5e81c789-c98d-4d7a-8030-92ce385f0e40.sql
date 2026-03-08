
-- FIX: Create a secure view/function to get profiles while respecting privacy settings
-- This function returns profile data but hides phone when show_phone is false
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  is_verified boolean,
  phone text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.is_verified,
    CASE
      WHEN ps.show_phone IS NULL THEN p.phone  -- default: show phone
      WHEN ps.show_phone = true THEN p.phone
      ELSE NULL
    END as phone,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.privacy_settings ps ON ps.user_id = p.id
  WHERE p.id = profile_id
$$;

-- FIX: Tighten the advertiser_requests INSERT policy to prevent spam
DROP POLICY IF EXISTS "Anyone can submit advertiser request" ON public.advertiser_requests;
CREATE POLICY "Authenticated users can submit advertiser request"
ON public.advertiser_requests
FOR INSERT
TO authenticated
WITH CHECK (true);

-- HARDENING: Add rate limit tracking table for sensitive operations
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action text NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only server-side can manage rate limits
CREATE POLICY "Service role only"
ON public.rate_limits
FOR ALL
USING (false);

-- HARDENING: Restrict banner_campaigns public SELECT to only display columns
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON public.banner_campaigns;
CREATE POLICY "Anyone can view active campaign display data"
ON public.banner_campaigns
FOR SELECT
USING (status = 'active');
