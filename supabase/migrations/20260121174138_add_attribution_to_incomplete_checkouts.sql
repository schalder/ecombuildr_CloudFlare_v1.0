-- Add attribution fields to incomplete_checkouts table (all nullable)
ALTER TABLE public.incomplete_checkouts
ADD COLUMN IF NOT EXISTS attribution_source TEXT NULL,
ADD COLUMN IF NOT EXISTS attribution_medium TEXT NULL,
ADD COLUMN IF NOT EXISTS attribution_campaign TEXT NULL,
ADD COLUMN IF NOT EXISTS attribution_data JSONB NULL;

-- Add index for attribution queries
CREATE INDEX IF NOT EXISTS idx_incomplete_checkouts_attribution_source ON public.incomplete_checkouts(attribution_source);

-- Add comments
COMMENT ON COLUMN public.incomplete_checkouts.attribution_source IS 'Traffic source: facebook, tiktok, google, organic, direct';
COMMENT ON COLUMN public.incomplete_checkouts.attribution_medium IS 'Traffic medium: cpc, social, organic, direct';
COMMENT ON COLUMN public.incomplete_checkouts.attribution_campaign IS 'Campaign name from UTM or ad platform';
COMMENT ON COLUMN public.incomplete_checkouts.attribution_data IS 'Full attribution details: UTM params, pixel IDs, referrer';
