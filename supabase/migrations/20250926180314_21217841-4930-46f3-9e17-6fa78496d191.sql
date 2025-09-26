-- Create product type enum
CREATE TYPE public.product_type AS ENUM ('physical', 'digital');

-- Add digital product columns to products table
ALTER TABLE public.products 
ADD COLUMN product_type public.product_type NOT NULL DEFAULT 'physical',
ADD COLUMN digital_files jsonb DEFAULT '[]'::jsonb,
ADD COLUMN download_limit integer DEFAULT NULL,
ADD COLUMN download_expiry_hours integer DEFAULT 24;

-- Create order_digital_downloads table for tracking download access
CREATE TABLE public.order_digital_downloads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  download_token text NOT NULL UNIQUE,
  downloads_remaining integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone NOT NULL,
  first_downloaded_at timestamp with time zone,
  last_downloaded_at timestamp with time zone,
  download_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on order_digital_downloads
ALTER TABLE public.order_digital_downloads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for order_digital_downloads
CREATE POLICY "Store owners can view digital downloads" 
ON public.order_digital_downloads 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.orders o 
  WHERE o.id = order_digital_downloads.order_id 
  AND is_store_owner(o.store_id)
));

CREATE POLICY "Anyone can access downloads with valid token" 
ON public.order_digital_downloads 
FOR SELECT 
USING (is_active = true AND expires_at > now());

-- Create indexes for performance
CREATE INDEX idx_order_digital_downloads_order_id ON public.order_digital_downloads(order_id);
CREATE INDEX idx_order_digital_downloads_token ON public.order_digital_downloads(download_token);
CREATE INDEX idx_order_digital_downloads_expires_at ON public.order_digital_downloads(expires_at);

-- Add comment for documentation
COMMENT ON TABLE public.order_digital_downloads IS 'Tracks digital product download access and limits for orders';