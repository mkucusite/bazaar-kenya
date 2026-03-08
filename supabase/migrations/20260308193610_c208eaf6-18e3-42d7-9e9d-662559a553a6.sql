
-- Function: create a notification for the message recipient
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  conv RECORD;
  recipient_id uuid;
  ad_title text;
  sender_name text;
BEGIN
  -- Get conversation details
  SELECT * INTO conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Determine recipient (the other person)
  IF NEW.sender_id = conv.buyer_id THEN
    recipient_id := conv.seller_id;
  ELSE
    recipient_id := conv.buyer_id;
  END IF;

  -- Get sender name
  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  sender_name := COALESCE(sender_name, 'Someone');

  -- Get ad title if available
  IF conv.ad_id IS NOT NULL THEN
    SELECT title INTO ad_title FROM public.ads WHERE id = conv.ad_id;
  END IF;
  ad_title := COALESCE(ad_title, 'a listing');

  -- Insert notification
  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (
    recipient_id,
    sender_name || ' sent you a message',
    'Re: ' || ad_title || ' — "' || LEFT(NEW.content, 80) || CASE WHEN LENGTH(NEW.content) > 80 THEN '...' ELSE '' END || '"',
    'message',
    '/chats'
  );

  RETURN NEW;
END;
$$;

-- Trigger on new message
CREATE TRIGGER trg_notify_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_message();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
