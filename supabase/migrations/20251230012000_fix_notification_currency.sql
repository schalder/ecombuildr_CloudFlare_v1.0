-- Fix notification currency to use actual currency instead of hardcoded $
-- Update create_order_notification function to get currency from order's website/funnel

CREATE OR REPLACE FUNCTION public.create_order_notification()
RETURNS TRIGGER AS $$
DECLARE
  currency_code TEXT := 'BDT'; -- Default to BDT
  currency_symbol TEXT := '৳'; -- Default to BDT symbol
  formatted_amount TEXT;
BEGIN
  -- Try to get currency from funnel settings
  IF NEW.funnel_id IS NOT NULL THEN
    SELECT 
      COALESCE(
        (settings->>'currency_code')::TEXT,
        (settings->'currency'->>'code')::TEXT
      )
    INTO currency_code
    FROM public.funnels
    WHERE id = NEW.funnel_id;
  END IF;
  
  -- If no currency from funnel, try website settings
  IF currency_code IS NULL OR currency_code = '' THEN
    IF NEW.website_id IS NOT NULL THEN
      SELECT 
        COALESCE(
          (settings->>'currency_code')::TEXT,
          (settings->'currency'->>'code')::TEXT
        )
      INTO currency_code
      FROM public.websites
      WHERE id = NEW.website_id;
    END IF;
  END IF;
  
  -- Default to BDT if still no currency found
  IF currency_code IS NULL OR currency_code = '' THEN
    currency_code := 'BDT';
  END IF;
  
  -- Map currency code to symbol
  CASE currency_code
    WHEN 'BDT' THEN currency_symbol := '৳';
    WHEN 'USD' THEN currency_symbol := '$';
    WHEN 'INR' THEN currency_symbol := '₹';
    WHEN 'EUR' THEN currency_symbol := '€';
    WHEN 'GBP' THEN currency_symbol := '£';
    ELSE currency_symbol := '$'; -- Fallback
  END CASE;
  
  -- Format amount with currency symbol
  formatted_amount := currency_symbol || NEW.total::TEXT;
  
  INSERT INTO public.notifications (store_id, type, title, message, metadata)
  VALUES (
    NEW.store_id,
    'new_order',
    'New Order #' || NEW.order_number,
    'Customer: ' || NEW.customer_name || ' - ' || formatted_amount,
    jsonb_build_object(
      'order_id', NEW.id, 
      'order_number', NEW.order_number, 
      'amount', NEW.total,
      'currency_code', currency_code
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Also update payment notification function (if it still exists)
-- Note: This function may have been removed in a later migration, but we'll update it if it exists
CREATE OR REPLACE FUNCTION public.create_payment_notification()
RETURNS TRIGGER AS $$
DECLARE
  currency_code TEXT := 'BDT'; -- Default to BDT
  currency_symbol TEXT := '৳'; -- Default to BDT symbol
  formatted_amount TEXT;
BEGIN
  -- Only trigger when order status changes to 'delivered' from another status
  IF OLD.status IS DISTINCT FROM NEW.status 
     AND NEW.status = 'delivered'
     AND OLD.status != 'delivered' THEN
    
    -- Try to get currency from funnel settings
    IF NEW.funnel_id IS NOT NULL THEN
      SELECT 
        COALESCE(
          (settings->>'currency_code')::TEXT,
          (settings->'currency'->>'code')::TEXT
        )
      INTO currency_code
      FROM public.funnels
      WHERE id = NEW.funnel_id;
    END IF;
    
    -- If no currency from funnel, try website settings
    IF currency_code IS NULL OR currency_code = '' THEN
      IF NEW.website_id IS NOT NULL THEN
        SELECT 
          COALESCE(
            (settings->>'currency_code')::TEXT,
            (settings->'currency'->>'code')::TEXT
          )
        INTO currency_code
        FROM public.websites
        WHERE id = NEW.website_id;
      END IF;
    END IF;
    
    -- Default to BDT if still no currency found
    IF currency_code IS NULL OR currency_code = '' THEN
      currency_code := 'BDT';
    END IF;
    
    -- Map currency code to symbol
    CASE currency_code
      WHEN 'BDT' THEN currency_symbol := '৳';
      WHEN 'USD' THEN currency_symbol := '$';
      WHEN 'INR' THEN currency_symbol := '₹';
      WHEN 'EUR' THEN currency_symbol := '€';
      WHEN 'GBP' THEN currency_symbol := '£';
      ELSE currency_symbol := '$'; -- Fallback
    END CASE;
    
    -- Format amount with currency symbol
    formatted_amount := currency_symbol || NEW.total::TEXT;
    
    INSERT INTO public.notifications (store_id, type, title, message, metadata)
    VALUES (
      NEW.store_id,
      'payment_received',
      'Order Delivered',
      'Order #' || NEW.order_number || ' - ' || formatted_amount,
      jsonb_build_object(
        'order_id', NEW.id, 
        'order_number', NEW.order_number, 
        'amount', NEW.total,
        'currency_code', currency_code
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

