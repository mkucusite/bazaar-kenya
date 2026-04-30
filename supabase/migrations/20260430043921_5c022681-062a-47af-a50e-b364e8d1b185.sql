ALTER TABLE public.banner_campaigns
  ADD COLUMN IF NOT EXISTS running_position text,
  ADD COLUMN IF NOT EXISTS party_name text,
  ADD COLUMN IF NOT EXISTS party_color text,
  ADD COLUMN IF NOT EXISTS candidate_number text,
  ADD COLUMN IF NOT EXISTS slogan text,
  ADD COLUMN IF NOT EXISTS manifesto_points text[];