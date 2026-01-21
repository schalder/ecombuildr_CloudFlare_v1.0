-- Function to automatically clean up incomplete checkouts when orders are created
-- This prevents abandoned checkouts from appearing after orders are successfully completed

CREATE OR REPLACE FUNCTION public.cleanup_incomplete_checkout_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete incomplete checkouts that match the new order by customer info
  -- Only delete if order is successfully created (not pending_payment, payment_failed, or cancelled)
  IF NEW.status NOT IN ('pending_payment', 'payment_failed', 'cancelled') THEN
    DELETE FROM public.incomplete_checkouts
    WHERE store_id = NEW.store_id
      AND (
        -- Match by phone number (if both exist and are not null)
        (customer_phone IS NOT NULL 
         AND NEW.customer_phone IS NOT NULL 
         AND customer_phone = NEW.customer_phone)
        OR
        -- Match by email (case-insensitive, if both exist and are not null)
        (customer_email IS NOT NULL 
         AND NEW.customer_email IS NOT NULL 
         AND LOWER(TRIM(customer_email)) = LOWER(TRIM(NEW.customer_email)))
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_cleanup_incomplete_checkout_on_order ON public.orders;
CREATE TRIGGER trigger_cleanup_incomplete_checkout_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_incomplete_checkout_on_order();

-- Also clean up when order status changes from incomplete to complete
CREATE OR REPLACE FUNCTION public.cleanup_incomplete_checkout_on_order_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If order status changed from incomplete to complete, clean up matching incomplete checkouts
  IF OLD.status IN ('pending_payment', 'payment_failed', 'cancelled')
     AND NEW.status NOT IN ('pending_payment', 'payment_failed', 'cancelled') THEN
    DELETE FROM public.incomplete_checkouts
    WHERE store_id = NEW.store_id
      AND (
        (customer_phone IS NOT NULL 
         AND NEW.customer_phone IS NOT NULL 
         AND customer_phone = NEW.customer_phone)
        OR
        (customer_email IS NOT NULL 
         AND NEW.customer_email IS NOT NULL 
         AND LOWER(TRIM(customer_email)) = LOWER(TRIM(NEW.customer_email)))
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on orders table for status updates
DROP TRIGGER IF EXISTS trigger_cleanup_incomplete_checkout_on_order_update ON public.orders;
CREATE TRIGGER trigger_cleanup_incomplete_checkout_on_order_update
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.cleanup_incomplete_checkout_on_order_update();
