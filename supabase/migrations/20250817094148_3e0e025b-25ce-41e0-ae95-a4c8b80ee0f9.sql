-- Fix the customer sync function to only fill NULL values, not overwrite existing ones
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
  
  -- Normalize phone numbers for comparison (remove spaces, dashes, etc.)
  DECLARE
    normalized_new_phone text := REGEXP_REPLACE(COALESCE(NEW.customer_phone, ''), '[^0-9+]', '', 'g');
  BEGIN
    -- Find existing customer with better matching logic
    SELECT * INTO customer_record
    FROM public.customers 
    WHERE store_id = NEW.store_id 
    AND (
      -- First priority: email match
      (NEW.customer_email IS NOT NULL AND LOWER(email) = LOWER(NEW.customer_email)) OR
      -- Second priority: phone match (normalized)
      (normalized_new_phone != '' AND REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9+]', '', 'g') = normalized_new_phone) OR
      -- Last resort: name match only if both email and phone are NULL in the order
      (NEW.customer_email IS NULL AND NEW.customer_phone IS NULL AND LOWER(full_name) = LOWER(NEW.customer_name))
    )
    ORDER BY 
      CASE 
        WHEN NEW.customer_email IS NOT NULL AND LOWER(email) = LOWER(NEW.customer_email) THEN 1
        WHEN normalized_new_phone != '' AND REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9+]', '', 'g') = normalized_new_phone THEN 2
        ELSE 3
      END
    LIMIT 1;
  END;
  
  IF customer_record.id IS NULL THEN
    -- Create new customer
    INSERT INTO public.customers (
      store_id, full_name, email, phone, city, area, created_at, updated_at
    ) VALUES (
      NEW.store_id,
      NEW.customer_name,
      NEW.customer_email,
      NEW.customer_phone,
      NEW.shipping_city,
      NEW.shipping_area,
      now(),
      now()
    ) RETURNING * INTO customer_record;
  ELSE
    -- Only fill NULL values, don't overwrite existing data
    UPDATE public.customers 
    SET 
      email = CASE WHEN email IS NULL THEN NEW.customer_email ELSE email END,
      phone = CASE WHEN phone IS NULL THEN NEW.customer_phone ELSE phone END,
      city = CASE WHEN city IS NULL THEN NEW.shipping_city ELSE city END,
      area = CASE WHEN area IS NULL THEN NEW.shipping_area ELSE area END,
      updated_at = now()
    WHERE id = customer_record.id;
  END IF;
  
  -- Update customer_id on the order
  IF NEW.customer_id IS DISTINCT FROM customer_record.id THEN
    UPDATE public.orders 
    SET customer_id = customer_record.id 
    WHERE id = NEW.id;
  END IF;
  
  -- Recalculate customer totals
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_sync_customer_from_order ON public.orders;
CREATE TRIGGER trigger_sync_customer_from_order
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_customer_from_order();

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_customers_store_email ON public.customers(store_id, email);
CREATE INDEX IF NOT EXISTS idx_customers_store_phone ON public.customers(store_id, phone);

-- Repair existing data: Process orders that don't have customer_id or have conflicting data
DO $$
DECLARE
  order_record RECORD;
  customer_record public.customers%ROWTYPE;
  normalized_phone text;
BEGIN
  -- Process all orders that need customer sync
  FOR order_record IN 
    SELECT DISTINCT ON (o.id) o.* 
    FROM public.orders o 
    WHERE o.customer_id IS NULL 
       OR NOT EXISTS (
         SELECT 1 FROM public.customers c 
         WHERE c.id = o.customer_id 
         AND c.store_id = o.store_id
       )
    ORDER BY o.id, o.created_at DESC
  LOOP
    -- Normalize phone for comparison
    normalized_phone := REGEXP_REPLACE(COALESCE(order_record.customer_phone, ''), '[^0-9+]', '', 'g');
    
    -- Find or create customer
    SELECT * INTO customer_record
    FROM public.customers 
    WHERE store_id = order_record.store_id 
    AND (
      (order_record.customer_email IS NOT NULL AND LOWER(email) = LOWER(order_record.customer_email)) OR
      (normalized_phone != '' AND REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9+]', '', 'g') = normalized_phone) OR
      (order_record.customer_email IS NULL AND order_record.customer_phone IS NULL AND LOWER(full_name) = LOWER(order_record.customer_name))
    )
    ORDER BY 
      CASE 
        WHEN order_record.customer_email IS NOT NULL AND LOWER(email) = LOWER(order_record.customer_email) THEN 1
        WHEN normalized_phone != '' AND REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9+]', '', 'g') = normalized_phone THEN 2
        ELSE 3
      END
    LIMIT 1;
    
    IF customer_record.id IS NULL THEN
      -- Create new customer
      INSERT INTO public.customers (
        store_id, full_name, email, phone, city, area, created_at, updated_at
      ) VALUES (
        order_record.store_id,
        order_record.customer_name,
        order_record.customer_email,
        order_record.customer_phone,
        order_record.shipping_city,
        order_record.shipping_area,
        order_record.created_at,
        now()
      ) RETURNING * INTO customer_record;
    ELSE
      -- Only fill NULL values
      UPDATE public.customers 
      SET 
        email = CASE WHEN email IS NULL THEN order_record.customer_email ELSE email END,
        phone = CASE WHEN phone IS NULL THEN order_record.customer_phone ELSE phone END,
        city = CASE WHEN city IS NULL THEN order_record.shipping_city ELSE city END,
        area = CASE WHEN area IS NULL THEN order_record.shipping_area ELSE area END,
        updated_at = now()
      WHERE id = customer_record.id;
    END IF;
    
    -- Link order to customer
    UPDATE public.orders 
    SET customer_id = customer_record.id 
    WHERE id = order_record.id;
  END LOOP;
  
  -- Recalculate totals for all customers
  UPDATE public.customers 
  SET 
    total_orders = (
      SELECT COUNT(*) 
      FROM public.orders 
      WHERE customer_id = customers.id 
      AND status != 'cancelled'
    ),
    total_spent = (
      SELECT COALESCE(SUM(total), 0) 
      FROM public.orders 
      WHERE customer_id = customers.id 
      AND status != 'cancelled'
    ),
    updated_at = now()
  WHERE id IN (
    SELECT DISTINCT customer_id 
    FROM public.orders 
    WHERE customer_id IS NOT NULL
  );
END $$;