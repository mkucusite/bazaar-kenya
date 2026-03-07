
-- Fix function search path
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Fix permissive anon insert on payments - remove it, we'll handle via edge function with service role
DROP POLICY "Anon can insert payments" ON public.payments;
