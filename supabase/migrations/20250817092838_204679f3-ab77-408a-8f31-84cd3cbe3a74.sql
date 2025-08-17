-- Fix the payment notification trigger to use valid status
CREATE OR REPLACE FUNCTION public.create_payment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only trigger when order status changes to 'delivered' from another status
  IF OLD.status IS DISTINCT FROM NEW.status 
     AND NEW.status = 'delivered'
     AND OLD.status != 'delivered' THEN
    
    INSERT INTO public.notifications (store_id, type, title, message, metadata)
    VALUES (
      NEW.store_id,
      'payment_received',
      'Order Delivered',
      'Order #' || NEW.order_number || ' - $' || NEW.total::TEXT,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'amount', NEW.total)
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Now run the customer backfill
WITH order_customers AS (
  SELECT 
    store_id,
    customer_name as full_name,
    customer_email as email,  
    customer_phone as phone,
    shipping_city as city,
    shipping_area as area,
    MIN(created_at) as first_order_date
  FROM public.orders
  WHERE status != 'cancelled'
  GROUP BY store_id, customer_name, customer_email, customer_phone, shipping_city, shipping_area
)
INSERT INTO public.customers (
  store_id, full_name, email, phone, city, area, total_orders, total_spent, created_at, updated_at
)
SELECT 
  oc.store_id,
  oc.full_name,
  oc.email,
  oc.phone,
  oc.city,
  oc.area,
  0, -- Will be updated below
  0, -- Will be updated below  
  oc.first_order_date,
  now()
FROM order_customers oc
WHERE NOT EXISTS (
  SELECT 1 FROM public.customers c 
  WHERE c.store_id = oc.store_id 
  AND (
    (oc.email IS NOT NULL AND c.email = oc.email) OR
    (oc.phone IS NOT NULL AND c.phone = oc.phone) OR
    (oc.email IS NULL AND oc.phone IS NULL AND c.full_name = oc.full_name)
  )
);

-- Update customer_id in orders
UPDATE public.orders o 
SET customer_id = c.id
FROM public.customers c
WHERE o.customer_id IS NULL 
AND o.store_id = c.store_id
AND (
  (o.customer_email IS NOT NULL AND c.email = o.customer_email) OR
  (o.customer_phone IS NOT NULL AND c.phone = o.customer_phone) OR  
  (o.customer_email IS NULL AND o.customer_phone IS NULL AND c.full_name = o.customer_name)
);

-- Update customer totals
UPDATE public.customers c
SET 
  total_orders = COALESCE((
    SELECT COUNT(*) FROM public.orders o 
    WHERE o.customer_id = c.id AND o.status != 'cancelled'
  ), 0),
  total_spent = COALESCE((
    SELECT SUM(total) FROM public.orders o 
    WHERE o.customer_id = c.id AND o.status != 'cancelled'  
  ), 0),
  updated_at = now();