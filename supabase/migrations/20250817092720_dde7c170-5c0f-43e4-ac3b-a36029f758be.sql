-- Create function to sync customer from order
CREATE OR REPLACE FUNCTION public.sync_customer_from_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  customer_record public.customers%ROWTYPE;
BEGIN
  -- Skip if order is cancelled
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;
  
  -- Find or create customer
  SELECT * INTO customer_record
  FROM public.customers 
  WHERE store_id = NEW.store_id 
  AND (
    (NEW.customer_email IS NOT NULL AND email = NEW.customer_email) OR
    (NEW.customer_phone IS NOT NULL AND phone = NEW.customer_phone) OR
    (full_name = NEW.customer_name AND NEW.customer_email IS NULL AND NEW.customer_phone IS NULL)
  )
  LIMIT 1;
  
  IF customer_record.id IS NULL THEN
    -- Create new customer
    INSERT INTO public.customers (
      store_id,
      full_name,
      email,
      phone,
      city,
      area,
      total_orders,
      total_spent
    ) VALUES (
      NEW.store_id,
      NEW.customer_name,
      NEW.customer_email,
      NEW.customer_phone,
      NEW.shipping_city,
      NEW.shipping_area,
      0, -- Will be updated below
      0  -- Will be updated below
    ) RETURNING * INTO customer_record;
  ELSE
    -- Update existing customer info with latest order data
    UPDATE public.customers 
    SET 
      email = COALESCE(NEW.customer_email, email),
      phone = COALESCE(NEW.customer_phone, phone),
      city = COALESCE(NEW.shipping_city, city),
      area = COALESCE(NEW.shipping_area, area),
      updated_at = now()
    WHERE id = customer_record.id;
  END IF;
  
  -- Update customer_id on the order
  UPDATE public.orders 
  SET customer_id = customer_record.id 
  WHERE id = NEW.id;
  
  -- Recalculate totals for this customer
  UPDATE public.customers 
  SET 
    total_orders = (
      SELECT COUNT(*) 
      FROM public.orders 
      WHERE customer_id = customer_record.id 
      AND status != 'cancelled'
    ),
    total_spent = (
      SELECT COALESCE(SUM(total), 0) 
      FROM public.orders 
      WHERE customer_id = customer_record.id 
      AND status != 'cancelled'
    ),
    updated_at = now()
  WHERE id = customer_record.id;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_sync_customer_from_order ON public.orders;
CREATE TRIGGER trigger_sync_customer_from_order
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_customer_from_order();

-- Backfill existing orders to create customers
DO $$
DECLARE
  order_record public.orders%ROWTYPE;
BEGIN
  FOR order_record IN 
    SELECT * FROM public.orders 
    WHERE status != 'cancelled'
    ORDER BY created_at ASC
  LOOP
    PERFORM public.sync_customer_from_order() FROM (SELECT order_record.*) AS NEW;
  END LOOP;
END $$;