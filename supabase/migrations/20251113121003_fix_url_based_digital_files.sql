-- Fix generate_order_download_links function to handle URL-based digital files correctly
-- URL-based files should NOT create entries in order_download_links table
-- Only uploaded/library files (type = 'upload') should create download links

CREATE OR REPLACE FUNCTION public.generate_order_download_links(p_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_order_item RECORD;
  v_digital_file RECORD;
  v_expiry_hours INTEGER;
  v_file_type TEXT;
  v_file_url TEXT;
BEGIN
  -- For each order item that has digital files
  FOR v_order_item IN 
    SELECT oi.*, p.digital_files, p.download_expiry_hours, p.download_limit
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id 
    AND p.product_type = 'digital'
    AND p.digital_files IS NOT NULL
  LOOP
    -- Parse digital files JSON and create download links
    IF v_order_item.digital_files IS NOT NULL THEN
      FOR v_digital_file IN 
        SELECT * FROM jsonb_array_elements(v_order_item.digital_files::jsonb)
      LOOP
        -- Get file type and URL
        v_file_type := COALESCE(v_digital_file->>'type', 'upload');
        v_file_url := v_digital_file->>'url';
        
        -- Only create download links for uploaded/library files (type = 'upload' or null)
        -- Skip URL-based files (type = 'url') - they will be fetched directly from products
        IF v_file_type != 'url' AND v_file_url IS NOT NULL THEN
          -- Get expiry hours (default to 168 hours = 7 days)
          v_expiry_hours := COALESCE(v_order_item.download_expiry_hours, 168);
          
          -- Insert download link tracking using 'url' field (not 'path')
          INSERT INTO public.order_download_links (
            order_id,
            digital_file_path,
            max_downloads,
            expires_at
          ) VALUES (
            p_order_id,
            v_file_url,
            COALESCE(v_order_item.download_limit, 5),
            now() + make_interval(hours => v_expiry_hours)
          )
          ON CONFLICT (order_id, digital_file_path) DO NOTHING;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

