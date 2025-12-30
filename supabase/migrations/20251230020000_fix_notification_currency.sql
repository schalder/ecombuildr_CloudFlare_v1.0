-- Fix notification currency display to use actual currency instead of hardcoded $
-- This migration updates the notification trigger functions to fetch currency from website settings
-- and format amounts with the correct currency symbol

-- Helper function to get currency symbol from currency code
CREATE OR REPLACE FUNCTION public.get_currency_symbol(currency_code TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE 
    WHEN currency_code = 'BDT' THEN '৳'
    WHEN currency_code = 'USD' THEN '$'
    WHEN currency_code = 'INR' THEN '₹'
    WHEN currency_code = 'EUR' THEN '€'
    WHEN currency_code = 'GBP' THEN '£'
    WHEN currency_code = 'CAD' THEN 'C$'
    WHEN currency_code = 'AUD' THEN 'A$'
    ELSE '$' -- Default fallback
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to get currency code from order
-- Priority: website.settings->currency->code > website.settings->currency_code > default BDT
CREATE OR REPLACE FUNCTION public.get_order_currency(order_website_id UUID)
RETURNS TEXT AS $$
DECLARE
  currency_code TEXT;
  website_settings JSONB;
BEGIN
  -- If no website_id, return default
  IF order_website_id IS NULL THEN
    RETURN 'BDT';
  END IF;
  
  -- Get website settings
  SELECT settings INTO website_settings
  FROM public.websites
  WHERE id = order_website_id;
  
  -- If website not found, return default
  IF website_settings IS NULL THEN
    RETURN 'BDT';
  END IF;
  
  -- Try nested currency.code first
  currency_code := website_settings->'currency'->>'code';
  
  -- If not found, try direct currency_code
  IF currency_code IS NULL THEN
    currency_code := website_settings->>'currency_code';
  END IF;
  
  -- Validate currency code (must be one of supported currencies)
  IF currency_code IN ('BDT', 'USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD') THEN
    RETURN currency_code;
  END IF;
  
  -- Default fallback
  RETURN 'BDT';
END;
$$ LANGUAGE plpgsql STABLE;

-- Updated function to create new order notification with correct currency
CREATE OR REPLACE FUNCTION public.create_order_notification()
RETURNS TRIGGER AS $$
DECLARE
  currency_code TEXT;
  currency_symbol TEXT;
  formatted_amount TEXT;
BEGIN
  -- Get currency code for this order
  currency_code := public.get_order_currency(NEW.website_id);
  
  -- Get currency symbol
  currency_symbol := public.get_currency_symbol(currency_code);
  
  -- Format amount with currency symbol (always show 2 decimal places)
  formatted_amount := currency_symbol || TO_CHAR(ROUND(NEW.total, 2), 'FM999999999.00');
  
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
      'currency', currency_code
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Updated function to create payment received notification with correct currency
CREATE OR REPLACE FUNCTION public.create_payment_notification()
RETURNS TRIGGER AS $$
DECLARE
  currency_code TEXT;
  currency_symbol TEXT;
  formatted_amount TEXT;
BEGIN
  -- Only trigger when order status changes to 'delivered' from another status
  IF OLD.status IS DISTINCT FROM NEW.status 
     AND NEW.status = 'delivered'
     AND OLD.status != 'delivered' THEN
    
    -- Get currency code for this order
    currency_code := public.get_order_currency(NEW.website_id);
    
    -- Get currency symbol
    currency_symbol := public.get_currency_symbol(currency_code);
    
    -- Format amount with currency symbol
    formatted_amount := currency_symbol || ROUND(NEW.total, 2)::TEXT;
    
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
        'currency', currency_code
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

