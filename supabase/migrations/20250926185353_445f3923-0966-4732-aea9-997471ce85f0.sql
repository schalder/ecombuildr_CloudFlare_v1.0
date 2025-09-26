-- Create table for order download links tracking
CREATE TABLE IF NOT EXISTS public.order_download_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  digital_file_path TEXT NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  max_downloads INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(order_id, digital_file_path)
);

-- Enable RLS
ALTER TABLE public.order_download_links ENABLE ROW LEVEL SECURITY;

-- Create policies for download links
CREATE POLICY "Anyone can view download links with valid order token" 
ON public.order_download_links 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id 
    AND o.custom_fields->>'order_access_token' IS NOT NULL
  )
);

-- Create function to generate download links for digital products
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
        -- Get expiry hours (default to 168 hours = 7 days)
        v_expiry_hours := COALESCE(v_order_item.download_expiry_hours, 168);
        
        -- Insert download link tracking
        INSERT INTO public.order_download_links (
          order_id,
          digital_file_path,
          max_downloads,
          expires_at
        ) VALUES (
          p_order_id,
          v_digital_file->>'path',
          COALESCE(v_order_item.download_limit, 5),
          now() + make_interval(hours => v_expiry_hours)
        )
        ON CONFLICT (order_id, digital_file_path) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

-- Create trigger to automatically generate download links when order is created
CREATE OR REPLACE FUNCTION public.trigger_generate_download_links()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Generate download links for digital products when order is created
  PERFORM public.generate_order_download_links(NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS generate_download_links_on_order_create ON public.orders;
CREATE TRIGGER generate_download_links_on_order_create
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_generate_download_links();