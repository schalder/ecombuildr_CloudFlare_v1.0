-- Add idempotency_key column to orders table for preventing duplicate orders
ALTER TABLE public.orders 
ADD COLUMN idempotency_key text;

-- Create unique index on idempotency_key to enforce uniqueness when present
CREATE UNIQUE INDEX idx_orders_idempotency_key 
ON public.orders (idempotency_key) 
WHERE idempotency_key IS NOT NULL;