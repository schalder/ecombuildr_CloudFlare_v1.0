-- Create platform shipping accounts table
CREATE TABLE public.platform_shipping_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  webhook_token TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider)
);

-- Enable RLS
ALTER TABLE public.platform_shipping_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for platform shipping accounts
CREATE POLICY "Super admin can manage platform shipping accounts" 
ON public.platform_shipping_accounts 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Create RPC function to get library product orders
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
SET search_path TO ''
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

-- Create trigger for updated_at
CREATE TRIGGER update_platform_shipping_accounts_updated_at
BEFORE UPDATE ON public.platform_shipping_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();