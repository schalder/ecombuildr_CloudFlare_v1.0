-- Create function to queue WhatsApp messages when notifications are created
CREATE OR REPLACE FUNCTION queue_whatsapp_notification()
RETURNS TRIGGER AS $$
DECLARE
  whatsapp_account RECORD;
BEGIN
  -- Get WhatsApp business account for the store
  SELECT * INTO whatsapp_account
  FROM whatsapp_business_accounts
  WHERE store_id = NEW.store_id 
    AND is_active = true 
    AND is_verified = true
  LIMIT 1;

  -- If WhatsApp account exists, queue the message
  IF FOUND THEN
    INSERT INTO whatsapp_message_queue (
      notification_id,
      store_id,
      recipient_phone,
      message_text
    ) VALUES (
      NEW.id,
      NEW.store_id,
      whatsapp_account.phone_number,
      format('🔔 *%s*\n\n%s', NEW.title, NEW.message)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_queue_whatsapp_notification ON notifications;
CREATE TRIGGER trigger_queue_whatsapp_notification
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION queue_whatsapp_notification();