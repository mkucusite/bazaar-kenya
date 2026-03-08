
-- Function to atomically increment banner impressions
CREATE OR REPLACE FUNCTION public.increment_banner_impressions(campaign_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.banner_campaigns
  SET impressions = impressions + 1
  WHERE id = campaign_id AND status = 'active';
$$;

-- Function to atomically increment banner clicks
CREATE OR REPLACE FUNCTION public.increment_banner_clicks(campaign_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.banner_campaigns
  SET clicks = clicks + 1
  WHERE id = campaign_id AND status = 'active';
$$;
