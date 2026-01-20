-- Create a SECURITY DEFINER function to insert incomplete checkouts
-- This bypasses RLS and allows anonymous inserts
CREATE OR REPLACE FUNCTION public.insert_incomplete_checkout(
  p_store_id UUID,
  p_website_id UUID DEFAULT NULL,
  p_funnel_id UUID DEFAULT NULL,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_email TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_shipping_address TEXT DEFAULT NULL,
  p_shipping_city TEXT DEFAULT NULL,
  p_shipping_area TEXT DEFAULT NULL,
  p_shipping_country TEXT DEFAULT NULL,
  p_shipping_state TEXT DEFAULT NULL,
  p_shipping_postal_code TEXT DEFAULT NULL,
  p_cart_items JSONB DEFAULT '[]'::jsonb,
  p_subtotal DECIMAL DEFAULT 0,
  p_shipping_cost DECIMAL DEFAULT 0,
  p_total DECIMAL DEFAULT 0,
  p_payment_method TEXT DEFAULT NULL,
  p_custom_fields JSONB DEFAULT '{}'::jsonb,
  p_session_id TEXT DEFAULT NULL,
  p_page_url TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_utm_source TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.incomplete_checkouts (
    store_id, website_id, funnel_id,
    customer_name, customer_email, customer_phone,
    shipping_address, shipping_city, shipping_area,
    shipping_country, shipping_state, shipping_postal_code,
    cart_items, subtotal, shipping_cost, total,
    payment_method, custom_fields,
    session_id, page_url, referrer,
    utm_source, utm_campaign, utm_medium
  ) VALUES (
    p_store_id, p_website_id, p_funnel_id,
    p_customer_name, p_customer_email, p_customer_phone,
    p_shipping_address, p_shipping_city, p_shipping_area,
    p_shipping_country, p_shipping_state, p_shipping_postal_code,
    p_cart_items, p_subtotal, p_shipping_cost, p_total,
    p_payment_method, p_custom_fields,
    p_session_id, p_page_url, p_referrer,
    p_utm_source, p_utm_campaign, p_utm_medium
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Grant execute permission to anon and authenticated
GRANT EXECUTE ON FUNCTION public.insert_incomplete_checkout TO anon;
GRANT EXECUTE ON FUNCTION public.insert_incomplete_checkout TO authenticated;
