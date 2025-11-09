-- Add fake order tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_potential_fake BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS marked_not_fake BOOLEAN DEFAULT false;

-- Add index for fake order queries
CREATE INDEX IF NOT EXISTS idx_orders_is_potential_fake 
ON public.orders(store_id, is_potential_fake, created_at DESC) 
WHERE is_potential_fake = true;

-- Create blocked IPs table
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_by UUID REFERENCES auth.users(id),
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, ip_address)
);

-- Add index for blocked IP lookups
CREATE INDEX IF NOT EXISTS idx_blocked_ips_store_ip 
ON public.blocked_ips(store_id, ip_address) 
WHERE is_active = true;

-- Add comments
COMMENT ON COLUMN public.orders.is_potential_fake IS 'Marked as potential fake order due to frequent IP orders';
COMMENT ON COLUMN public.orders.marked_not_fake IS 'Merchant marked this order as not fake, moved to regular list';
COMMENT ON TABLE public.blocked_ips IS 'Blocked IP addresses per store to prevent fake orders';

