-- Remove store-level pixel tracking columns as they are no longer used
-- The system now uses website-level and funnel-level pixel configuration instead

ALTER TABLE public.stores 
DROP COLUMN IF EXISTS facebook_pixel_id,
DROP COLUMN IF EXISTS google_analytics_id,
DROP COLUMN IF EXISTS google_ads_id;