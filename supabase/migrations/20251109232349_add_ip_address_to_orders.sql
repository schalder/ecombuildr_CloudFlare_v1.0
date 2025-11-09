-- Add IP address column to orders table for fraud detection
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Add index for faster IP-based queries
CREATE INDEX IF NOT EXISTS idx_orders_ip_address_created_at 
ON public.orders(ip_address, created_at DESC) 
WHERE ip_address IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.orders.ip_address IS 'IP address of the client who placed the order, used for fraud detection';

