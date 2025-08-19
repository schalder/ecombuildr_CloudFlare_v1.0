-- Create RPC function to get imported products for a store (workaround for type issues)
CREATE OR REPLACE FUNCTION public.get_imported_products(store_id_param uuid)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  result text[];
BEGIN
  SELECT array_agg(library_item_id::text)
  INTO result
  FROM public.product_library_imports
  WHERE store_id = store_id_param;
  
  RETURN COALESCE(result, ARRAY[]::text[]);
END;
$function$;

-- Create RPC function to record product imports (workaround for type issues)
CREATE OR REPLACE FUNCTION public.record_product_import(
  library_item_id_param uuid,
  store_id_param uuid,
  product_id_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.product_library_imports (
    library_item_id,
    store_id,
    product_id,
    status
  ) VALUES (
    library_item_id_param,
    store_id_param,
    product_id_param,
    'imported'
  )
  ON CONFLICT (library_item_id, store_id) DO NOTHING;
END;
$function$;