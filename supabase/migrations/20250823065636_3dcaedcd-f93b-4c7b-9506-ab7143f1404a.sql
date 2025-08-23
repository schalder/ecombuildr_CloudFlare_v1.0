-- Remove push subscription table since we're switching to WhatsApp
DROP TABLE IF EXISTS push_subscriptions;

-- Create WhatsApp business accounts table for store owners
CREATE TABLE whatsapp_business_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  phone_number_id TEXT, -- WhatsApp Business API phone number ID
  business_account_id TEXT, -- WhatsApp Business Account ID
  access_token TEXT, -- WhatsApp API access token
  webhook_verify_token TEXT, -- For webhook verification
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

-- Create WhatsApp message queue for reliable delivery
CREATE TABLE whatsapp_message_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  message_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  whatsapp_message_id TEXT, -- ID returned by WhatsApp API
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  send_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add delivery status and method to notifications table
ALTER TABLE notifications 
ADD COLUMN delivery_method TEXT DEFAULT 'whatsapp' CHECK (delivery_method IN ('whatsapp', 'email', 'sms')),
ADD COLUMN delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on new tables
ALTER TABLE whatsapp_business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for whatsapp_business_accounts
CREATE POLICY "Store owners can manage WhatsApp accounts"
ON whatsapp_business_accounts
FOR ALL
USING (is_store_owner(store_id))
WITH CHECK (is_store_owner(store_id));

-- RLS policies for whatsapp_message_queue  
CREATE POLICY "Store owners can view message queue"
ON whatsapp_message_queue
FOR SELECT
USING (is_store_owner(store_id));

CREATE POLICY "Store owners can insert messages"
ON whatsapp_message_queue
FOR INSERT
WITH CHECK (is_store_owner(store_id));

CREATE POLICY "System can update message status"
ON whatsapp_message_queue
FOR UPDATE
USING (true);

-- Create indexes for performance
CREATE INDEX idx_whatsapp_message_queue_status ON whatsapp_message_queue(status);
CREATE INDEX idx_whatsapp_message_queue_send_at ON whatsapp_message_queue(send_at);
CREATE INDEX idx_whatsapp_message_queue_store_id ON whatsapp_message_queue(store_id);

-- Create function to queue WhatsApp messages when notifications are created
CREATE OR REPLACE FUNCTION queue_whatsapp_notification()
RETURNS TRIGGER AS $$
DECLARE
  whatsapp_account whatsapp_business_accounts%ROWTYPE;
  store_owner_phone TEXT;
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

-- Add updated_at triggers
CREATE TRIGGER update_whatsapp_business_accounts_updated_at
  BEFORE UPDATE ON whatsapp_business_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_message_queue_updated_at
  BEFORE UPDATE ON whatsapp_message_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();