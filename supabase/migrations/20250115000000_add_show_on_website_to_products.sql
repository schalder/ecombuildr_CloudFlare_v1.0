-- Add show_on_website column to products table
-- This column controls whether a product appears on website storefront
-- Products can be active (is_active = true) but hidden from website (show_on_website = false)
-- This allows products to be used in funnels while remaining hidden on the website

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS show_on_website BOOLEAN NOT NULL DEFAULT true;

-- Add comment to explain the column
COMMENT ON COLUMN public.products.show_on_website IS 'Controls visibility on website storefront. When false, product is hidden from website but can still be used in funnels if is_active is true.';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_show_on_website ON public.products(show_on_website) WHERE show_on_website = true;

