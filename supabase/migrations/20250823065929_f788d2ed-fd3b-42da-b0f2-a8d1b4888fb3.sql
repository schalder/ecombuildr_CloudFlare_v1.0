-- Create function to queue WhatsApp messages when notifications are created
CREATE OR REPLACE FUNCTION queue_whatsapp_notification()
RETURNS TRIGGER AS $$
DECLARE
  whatsapp_account whatsapp_business_accounts%ROWTYPE;
BEGIN
  -- Get WhatsApp business account for the store
  SELECT * INTO whatsapp_account
  FROM whatsapp_business_accounts
  WHERE store_id = NEW.store_id 
    AND is_active = true 
    AND is_verified = true;

  -- If WhatsApp account exists, queue the message
  IF whatsapp_account.id IS NOT NULL THEN
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

-- Create trigger to queue WhatsApp messages
CREATE TRIGGER trigger_queue_whatsapp_notification
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION queue_whatsapp_notification();