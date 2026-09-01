-- Indexing dashboard tables
CREATE TABLE IF NOT EXISTS public.seo_url_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  last_checked timestamptz,
  last_pinged timestamptz,
  ping_count integer NOT NULL DEFAULT 0,
  inspection_result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seo_url_index_status_idx ON public.seo_url_index(status);
CREATE INDEX IF NOT EXISTS seo_url_index_updated_idx ON public.seo_url_index(updated_at DESC);

CREATE TABLE IF NOT EXISTS public.seo_api_usage (
  day date PRIMARY KEY,
  gsc_calls integer NOT NULL DEFAULT 0,
  ping_calls integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_url_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage seo_url_index" ON public.seo_url_index
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage seo_api_usage" ON public.seo_api_usage
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER seo_url_index_set_updated_at
  BEFORE UPDATE ON public.seo_url_index
  FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

CREATE TRIGGER seo_api_usage_set_updated_at
  BEFORE UPDATE ON public.seo_api_usage
  FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();