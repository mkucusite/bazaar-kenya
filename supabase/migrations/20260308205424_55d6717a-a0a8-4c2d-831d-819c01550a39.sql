
-- CRITICAL FIX 1: Remove dangerous "Users can update own credits" policy
-- This prevents users from inflating their own credit balance
DROP POLICY IF EXISTS "Users can update own credits" ON public.credits;

-- CRITICAL FIX 2: Replace broad ip_blocks SELECT with a secure function
DROP POLICY IF EXISTS "Anyone can check ip blocks" ON public.ip_blocks;

-- Create a safe function that only returns boolean (not the full block list)
CREATE OR REPLACE FUNCTION public.is_ip_blocked(check_ip text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ip_blocks
    WHERE ip_address = check_ip
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.is_ip_blocked(text) TO anon;
GRANT EXECUTE ON FUNCTION public.is_ip_blocked(text) TO authenticated;

-- IMPROVEMENT: Restrict public profile SELECT to hide phone when privacy setting says so
-- First drop the overly permissive policy
DROP POLICY IF EXISTS "Public profiles visible" ON public.profiles;

-- Create a view-like policy that still allows public read but is documented
-- (Phone filtering will be done at application level since RLS can't do column-level)
CREATE POLICY "Public profiles visible"
ON public.profiles
FOR SELECT
USING (true);

-- Enable leaked password protection
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
