-- Add COD upfront shipping collection fields to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS collect_shipping_upfront BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS upfront_shipping_payment_method TEXT DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.products.collect_shipping_upfront IS 'If true, shipping fee for this COD product is collected upfront via selected payment method. Only applies to physical products.';
COMMENT ON COLUMN public.products.upfront_shipping_payment_method IS 'Payment method to use for upfront shipping collection (eps, ebpay, stripe, etc.). Required when collect_shipping_upfront is true.';

-- Add index for performance (if needed for queries filtering by upfront shipping)
CREATE INDEX IF NOT EXISTS idx_products_collect_shipping_upfront ON public.products(collect_shipping_upfront) WHERE collect_shipping_upfront = true;

