-- Add contact tracking fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS contact_status TEXT CHECK (contact_status IN ('contacted', 'replied')) NULL,
ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ NULL;

-- Add contact tracking fields to incomplete_checkouts table
ALTER TABLE public.incomplete_checkouts
ADD COLUMN IF NOT EXISTS contact_status TEXT CHECK (contact_status IN ('contacted', 'replied')) NULL,
ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ NULL;

-- Add indexes for filtering by contact status
CREATE INDEX IF NOT EXISTS idx_orders_contact_status ON public.orders(contact_status);
CREATE INDEX IF NOT EXISTS idx_incomplete_checkouts_contact_status ON public.incomplete_checkouts(contact_status);

-- Add comments for documentation
COMMENT ON COLUMN public.orders.contact_status IS 'Contact status: contacted (user reached out), replied (customer responded)';
COMMENT ON COLUMN public.orders.contacted_at IS 'Timestamp when customer was marked as contacted';
COMMENT ON COLUMN public.orders.replied_at IS 'Timestamp when customer was marked as replied';

COMMENT ON COLUMN public.incomplete_checkouts.contact_status IS 'Contact status: contacted (user reached out), replied (customer responded)';
COMMENT ON COLUMN public.incomplete_checkouts.contacted_at IS 'Timestamp when customer was marked as contacted';
COMMENT ON COLUMN public.incomplete_checkouts.replied_at IS 'Timestamp when customer was marked as replied';
