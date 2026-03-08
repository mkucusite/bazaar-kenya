
-- Fix overly permissive INSERT policy on login_logs
DROP POLICY "Admins can insert login logs" ON public.login_logs;

-- Allow authenticated users to insert their own login logs
CREATE POLICY "Users can log own events" ON public.login_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
