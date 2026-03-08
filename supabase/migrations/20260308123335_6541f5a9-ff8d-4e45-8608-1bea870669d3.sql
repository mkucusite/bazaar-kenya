-- Admin credits management policies
DROP POLICY IF EXISTS "Admins can view all credits" ON public.credits;
CREATE POLICY "Admins can view all credits"
ON public.credits
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all credits" ON public.credits;
CREATE POLICY "Admins can update all credits"
ON public.credits
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert credits" ON public.credits;
CREATE POLICY "Admins can insert credits"
ON public.credits
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));