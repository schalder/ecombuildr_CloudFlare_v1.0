-- Create incomplete_checkouts table to capture abandoned checkout data
CREATE TABLE IF NOT EXISTS public.incomplete_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  website_id UUID REFERENCES public.websites(id) ON DELETE SET NULL,
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE SET NULL,
  
  -- Customer information (captured from form)
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_area TEXT,
  shipping_country TEXT,
  shipping_state TEXT,
  shipping_postal_code TEXT,
  
  -- Order information
  cart_items JSONB DEFAULT '[]'::jsonb, -- Store cart items as JSON
  subtotal DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  payment_method TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  -- Tracking
  session_id TEXT, -- To identify same user session
  page_url TEXT, -- Where they started checkout
  referrer TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  utm_medium TEXT,
  
  -- Metadata
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days' -- Auto-cleanup after 30 days
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_incomplete_checkouts_store_id ON public.incomplete_checkouts(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incomplete_checkouts_session_id ON public.incomplete_checkouts(session_id);
CREATE INDEX IF NOT EXISTS idx_incomplete_checkouts_customer_phone ON public.incomplete_checkouts(customer_phone);
CREATE INDEX IF NOT EXISTS idx_incomplete_checkouts_expires_at ON public.incomplete_checkouts(expires_at);

-- RLS Policies
ALTER TABLE public.incomplete_checkouts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Store owners can view their incomplete checkouts" ON public.incomplete_checkouts;
DROP POLICY IF EXISTS "Store owners can insert their incomplete checkouts" ON public.incomplete_checkouts;
DROP POLICY IF EXISTS "Store owners can update their incomplete checkouts" ON public.incomplete_checkouts;
DROP POLICY IF EXISTS "Store owners can delete their incomplete checkouts" ON public.incomplete_checkouts;

CREATE POLICY "Store owners can view their incomplete checkouts"
  ON public.incomplete_checkouts
  FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can insert their incomplete checkouts"
  ON public.incomplete_checkouts
  FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can update their incomplete checkouts"
  ON public.incomplete_checkouts
  FOR UPDATE
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can delete their incomplete checkouts"
  ON public.incomplete_checkouts
  FOR DELETE
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- Function to auto-cleanup expired incomplete checkouts (runs daily)
CREATE OR REPLACE FUNCTION cleanup_expired_incomplete_checkouts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.incomplete_checkouts
  WHERE expires_at < NOW();
END;
$$;
