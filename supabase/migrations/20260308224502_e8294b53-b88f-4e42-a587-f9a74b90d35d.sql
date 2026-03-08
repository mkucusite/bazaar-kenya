-- Allow users to delete their own banner campaigns
CREATE POLICY "Users can delete own campaigns"
ON public.banner_campaigns
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);