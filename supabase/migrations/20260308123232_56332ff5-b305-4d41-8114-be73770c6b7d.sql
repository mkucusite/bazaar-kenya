-- Admin moderation queue for ad reports
CREATE TABLE IF NOT EXISTS public.ad_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  ai_label TEXT,
  ai_summary TEXT,
  ai_confidence NUMERIC,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ad_id, reporter_id)
);

-- User-requested alerts that admins can review
CREATE TABLE IF NOT EXISTS public.alert_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  category TEXT,
  county TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated-at trigger helper
CREATE OR REPLACE FUNCTION public.set_row_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ad_reports_updated_at ON public.ad_reports;
CREATE TRIGGER trg_ad_reports_updated_at
BEFORE UPDATE ON public.ad_reports
FOR EACH ROW
EXECUTE FUNCTION public.set_row_updated_at();

DROP TRIGGER IF EXISTS trg_alert_requests_updated_at ON public.alert_requests;
CREATE TRIGGER trg_alert_requests_updated_at
BEFORE UPDATE ON public.alert_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_row_updated_at();

ALTER TABLE public.ad_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_requests ENABLE ROW LEVEL SECURITY;

-- ad_reports policies
DROP POLICY IF EXISTS "Users can report ads" ON public.ad_reports;
CREATE POLICY "Users can report ads"
ON public.ad_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view own reports" ON public.ad_reports;
CREATE POLICY "Users can view own reports"
ON public.ad_reports
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON public.ad_reports;
CREATE POLICY "Admins can view all reports"
ON public.ad_reports
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all reports" ON public.ad_reports;
CREATE POLICY "Admins can update all reports"
ON public.ad_reports
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- alert_requests policies
DROP POLICY IF EXISTS "Users can request alerts" ON public.alert_requests;
CREATE POLICY "Users can request alerts"
ON public.alert_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own alert requests" ON public.alert_requests;
CREATE POLICY "Users can view own alert requests"
ON public.alert_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all alert requests" ON public.alert_requests;
CREATE POLICY "Admins can view all alert requests"
ON public.alert_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update alert requests" ON public.alert_requests;
CREATE POLICY "Admins can update alert requests"
ON public.alert_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin ads moderation access
DROP POLICY IF EXISTS "Admins can view all ads" ON public.ads;
CREATE POLICY "Admins can view all ads"
ON public.ads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all ads" ON public.ads;
CREATE POLICY "Admins can update all ads"
ON public.ads
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete all ads" ON public.ads;
CREATE POLICY "Admins can delete all ads"
ON public.ads
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_ad_reports_ad_id ON public.ad_reports(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_reports_status ON public.ad_reports(status);
CREATE INDEX IF NOT EXISTS idx_alert_requests_user_id ON public.alert_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_requests_status ON public.alert_requests(status);