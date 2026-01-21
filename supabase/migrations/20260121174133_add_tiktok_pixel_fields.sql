-- Add TikTok pixel fields to websites table (all nullable)
ALTER TABLE public.websites 
ADD COLUMN IF NOT EXISTS tiktok_pixel_id TEXT NULL,
ADD COLUMN IF NOT EXISTS tiktok_access_token TEXT NULL,
ADD COLUMN IF NOT EXISTS tiktok_server_side_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tiktok_test_event_code TEXT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.websites.tiktok_pixel_id IS 'TikTok Pixel ID for conversion tracking';
COMMENT ON COLUMN public.websites.tiktok_access_token IS 'TikTok Access Token for Events API server-side tracking';
COMMENT ON COLUMN public.websites.tiktok_server_side_enabled IS 'Enable/disable TikTok server-side event forwarding';
COMMENT ON COLUMN public.websites.tiktok_test_event_code IS 'TikTok Test Event Code for testing server-side events';
