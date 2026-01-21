-- Add TikTok tracking fields to pixel_events table
ALTER TABLE public.pixel_events
ADD COLUMN IF NOT EXISTS ttclid TEXT NULL,
ADD COLUMN IF NOT EXISTS tiktok_event_id TEXT NULL;

-- Add index for TikTok event queries
CREATE INDEX IF NOT EXISTS idx_pixel_events_ttclid ON public.pixel_events(ttclid);
