
-- Allow conversation participants to mark messages as read
CREATE POLICY "Participants can update message read status"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);

-- Allow conversation participants to update conversation timestamp
CREATE POLICY "Participants can update conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
)
WITH CHECK (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);
