-- Fix the get_digital_files_library function to use correct column name
CREATE OR REPLACE FUNCTION public.get_digital_files_library(store_id_param uuid)
RETURNS TABLE(
  id text,
  name text,
  url text,
  size bigint,
  type text,
  product_name text,
  product_id uuid,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((file_data->>'id')::text, p.id::text || '-' || (file_data->>'name')::text) as id,
    (file_data->>'name')::text as name,
    (file_data->>'url')::text as url,
    CASE 
      WHEN file_data->>'size' IS NOT NULL THEN (file_data->>'size')::bigint
      ELSE NULL 
    END as size,
    COALESCE((file_data->>'type')::text, 'upload') as type,
    p.name as product_name,
    p.id as product_id,
    p.created_at
  FROM public.products p,
       jsonb_array_elements(p.digital_files) as file_data
  WHERE p.store_id = store_id_param
    AND p.product_type = 'digital'
    AND p.digital_files IS NOT NULL
    AND jsonb_array_length(p.digital_files) > 0
    AND file_data->>'name' IS NOT NULL
    AND file_data->>'url' IS NOT NULL
  ORDER BY p.created_at DESC;
END;
$$;