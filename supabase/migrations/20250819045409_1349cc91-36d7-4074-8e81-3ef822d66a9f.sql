-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.get_library_product_orders(library_product_id_param UUID)
RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  store_name TEXT,
  customer_name TEXT,
  customer_email TEXT,
  total NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  product_name TEXT,
  quantity INTEGER,
  price NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    o.order_number,
    s.name as store_name,
    o.customer_name,
    o.customer_email,
    o.total,
    o.status::TEXT,
    o.created_at,
    oi.product_name,
    oi.quantity,
    oi.price
  FROM public.orders o
  JOIN public.stores s ON s.id = o.store_id
  JOIN public.order_items oi ON oi.order_id = o.id
  JOIN public.products p ON p.id = oi.product_id
  JOIN public.product_library_imports pli ON pli.product_id = p.id
  WHERE pli.library_item_id = library_product_id_param
  ORDER BY o.created_at DESC;
END;
$function$;