-- Add attribution fields to orders table (all nullable)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS attribution_source TEXT NULL,
ADD COLUMN IF NOT EXISTS attribution_medium TEXT NULL,
ADD COLUMN IF NOT EXISTS attribution_campaign TEXT NULL,
ADD COLUMN IF NOT EXISTS attribution_data JSONB NULL,
ADD COLUMN IF NOT EXISTS tiktok_pixel_data JSONB NULL;

-- Add index for attribution queries
CREATE INDEX IF NOT EXISTS idx_orders_attribution_source ON public.orders(attribution_source);
CREATE INDEX IF NOT EXISTS idx_orders_attribution_campaign ON public.orders(attribution_campaign);

-- Add comments
COMMENT ON COLUMN public.orders.attribution_source IS 'Traffic source: facebook, tiktok, google, organic, direct';
COMMENT ON COLUMN public.orders.attribution_medium IS 'Traffic medium: cpc, social, organic, direct';
COMMENT ON COLUMN public.orders.attribution_campaign IS 'Campaign name from UTM or ad platform';
COMMENT ON COLUMN public.orders.attribution_data IS 'Full attribution details: UTM params, pixel IDs, referrer';
COMMENT ON COLUMN public.orders.tiktok_pixel_data IS 'TikTok pixel event data for server-side tracking';
