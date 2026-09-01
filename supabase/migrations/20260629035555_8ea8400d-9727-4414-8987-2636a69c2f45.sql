
-- 1. Unclaim everyone: cancel any existing politician_claim banner_campaigns
UPDATE public.banner_campaigns
   SET status = 'cancelled', updated_at = now()
 WHERE category = 'politician_claim'
   AND status <> 'cancelled';

-- 2. Politician edit-approval queue
CREATE TABLE IF NOT EXISTS public.politician_edit_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  politician_slug TEXT NOT NULL,
  banner_id UUID REFERENCES public.banner_campaigns(id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changes JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.politician_edit_requests TO authenticated;
GRANT ALL ON public.politician_edit_requests TO service_role;

ALTER TABLE public.politician_edit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own edit requests"
  ON public.politician_edit_requests FOR SELECT
  TO authenticated
  USING (submitted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users submit their own edit requests"
  ON public.politician_edit_requests FOR INSERT
  TO authenticated
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Admins update edit requests"
  ON public.politician_edit_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_per_updated_at
  BEFORE UPDATE ON public.politician_edit_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_per_status ON public.politician_edit_requests(status, created_at DESC);
CREATE INDEX idx_per_slug ON public.politician_edit_requests(politician_slug);

-- 3. Admin override on politician claims — admin can force-claim or revoke
-- Add an "admin_revoked" flag column we can use to invalidate a claim
ALTER TABLE public.banner_campaigns
  ADD COLUMN IF NOT EXISTS admin_revoked BOOLEAN NOT NULL DEFAULT false;

-- 4. Notify admins on new payment
CREATE OR REPLACE FUNCTION public.notify_admins_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id UUID;
  body_text TEXT;
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    body_text := 'KSh ' || NEW.amount::text || ' (' || COALESCE(NEW.package_type,'payment') || ') from ' || COALESCE(NEW.phone_number,'unknown');
    FOR admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
      INSERT INTO public.notifications (user_id, title, body, type, link)
      VALUES (admin_id, 'New payment received', body_text, 'admin_payment', '/admin?tab=payments');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_payment ON public.payments;
CREATE TRIGGER trg_notify_admins_payment
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_payment();

-- 5. Notify admins on new politician edit request
CREATE OR REPLACE FUNCTION public.notify_admins_on_edit_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id UUID;
BEGIN
  IF NEW.status = 'pending' THEN
    FOR admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
      INSERT INTO public.notifications (user_id, title, body, type, link)
      VALUES (admin_id, 'Politician edit awaiting review',
        'Edit submitted for ' || NEW.politician_slug, 'admin_edit_request', '/admin?tab=politicians');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_edit_request ON public.politician_edit_requests;
CREATE TRIGGER trg_notify_admins_edit_request
  AFTER INSERT ON public.politician_edit_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_edit_request();
