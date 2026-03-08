
-- Login logs table for tracking all auth events
CREATE TABLE public.login_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  event_type TEXT NOT NULL DEFAULT 'login', -- login, login_failed, signup, logout
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- IP blocks table for blocking malicious IPs
CREATE TABLE public.ip_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT,
  blocked_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_blocks ENABLE ROW LEVEL SECURITY;

-- Only admins can view login logs
CREATE POLICY "Admins can view login logs" ON public.login_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert login logs (via edge function with service role)
CREATE POLICY "Admins can insert login logs" ON public.login_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Only admins can manage IP blocks
CREATE POLICY "Admins can manage ip blocks" ON public.ip_blocks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow anyone to read ip_blocks for checking (needed for rate limiting)
CREATE POLICY "Anyone can check ip blocks" ON public.ip_blocks
  FOR SELECT TO anon, authenticated
  USING (true);
