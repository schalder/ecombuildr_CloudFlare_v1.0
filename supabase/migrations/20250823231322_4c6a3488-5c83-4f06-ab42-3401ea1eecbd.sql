
-- Ensure realtime works for notifications (idempotent)
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 1) New order notification
CREATE OR REPLACE FUNCTION public.create_order_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.notifications (store_id, type, title, message, metadata)
  VALUES (
    NEW.store_id,
    'new_order',
    'New Order #' || NEW.order_number,
    'Customer: ' || COALESCE(NULLIF(NEW.customer_name, ''), 'Customer') || ' - $' || NEW.total::TEXT,
    jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'amount', NEW.total)
  );
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS create_order_notification_trigger ON public.orders;
CREATE TRIGGER create_order_notification_trigger
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.create_order_notification();

-- 2) Order cancelled notification
CREATE OR REPLACE FUNCTION public.create_order_cancelled_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cancelled' THEN
    INSERT INTO public.notifications (store_id, type, title, message, metadata)
    VALUES (
      NEW.store_id,
      'order_cancelled',
      'Order Cancelled #' || NEW.order_number,
      'Order #' || NEW.order_number || ' has been cancelled.',
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'amount', NEW.total)
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS create_order_cancelled_notification_trigger ON public.orders;
CREATE TRIGGER create_order_cancelled_notification_trigger
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.create_order_cancelled_notification();

-- 3) Low stock notification (uses store.settings.email_notifications.low_stock_threshold if present, else 5)
CREATE OR REPLACE FUNCTION public.create_low_stock_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  threshold integer;
BEGIN
  -- Only when inventory decreases and product tracks inventory
  IF OLD.inventory_quantity IS DISTINCT FROM NEW.inventory_quantity
     AND NEW.inventory_quantity < OLD.inventory_quantity
     AND COALESCE(NEW.track_inventory, false) = true THEN

    SELECT COALESCE((s.settings->'email_notifications'->>'low_stock_threshold')::int, 5)
    INTO threshold
    FROM public.stores s
    WHERE s.id = NEW.store_id;

    IF NEW.inventory_quantity <= COALESCE(threshold, 5) THEN
      INSERT INTO public.notifications (store_id, type, title, message, metadata)
      VALUES (
        NEW.store_id,
        'low_stock',
        'Low Stock: ' || NEW.name,
        'Only ' || NEW.inventory_quantity::text || ' left in stock.',
        jsonb_build_object('product_id', NEW.id, 'product_name', NEW.name, 'quantity', NEW.inventory_quantity)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS create_low_stock_notification_trigger ON public.products;
CREATE TRIGGER create_low_stock_notification_trigger
AFTER UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.create_low_stock_notification();

-- 4) Helpful index for fast reads in the UI (idempotent)
CREATE INDEX IF NOT EXISTS idx_notifications_store_id_created_at
  ON public.notifications (store_id, created_at DESC);
