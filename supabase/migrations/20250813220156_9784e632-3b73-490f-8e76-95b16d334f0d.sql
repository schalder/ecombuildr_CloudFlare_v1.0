-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Store owners can manage their notifications" 
ON public.notifications 
FOR ALL 
USING (is_store_owner(store_id));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create new order notification
CREATE OR REPLACE FUNCTION public.create_order_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (store_id, type, title, message, metadata)
  VALUES (
    NEW.store_id,
    'new_order',
    'New Order #' || NEW.order_number,
    'Customer: ' || NEW.customer_name || ' - $' || NEW.total::TEXT,
    jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'amount', NEW.total)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Function to create low stock notification
CREATE OR REPLACE FUNCTION public.create_low_stock_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if inventory is being reduced and goes below 5
  IF OLD.inventory_quantity IS DISTINCT FROM NEW.inventory_quantity 
     AND NEW.inventory_quantity <= 5 
     AND NEW.inventory_quantity < OLD.inventory_quantity 
     AND NEW.track_inventory = true THEN
    
    INSERT INTO public.notifications (store_id, type, title, message, metadata)
    VALUES (
      NEW.store_id,
      'low_stock',
      'Low Stock Alert',
      'Product: ' || NEW.name || ' - ' || NEW.inventory_quantity || ' left',
      jsonb_build_object('product_id', NEW.id, 'product_name', NEW.name, 'quantity', NEW.inventory_quantity)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Function to create payment received notification
CREATE OR REPLACE FUNCTION public.create_payment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when order status changes to 'paid' from another status
  IF OLD.status IS DISTINCT FROM NEW.status 
     AND NEW.status = 'paid'
     AND OLD.status != 'paid' THEN
    
    INSERT INTO public.notifications (store_id, type, title, message, metadata)
    VALUES (
      NEW.store_id,
      'payment_received',
      'Payment Received',
      'Order #' || NEW.order_number || ' - $' || NEW.total::TEXT,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'amount', NEW.total)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create triggers
CREATE TRIGGER create_order_notification_trigger
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.create_order_notification();

CREATE TRIGGER create_low_stock_notification_trigger
AFTER UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.create_low_stock_notification();

CREATE TRIGGER create_payment_notification_trigger
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.create_payment_notification();