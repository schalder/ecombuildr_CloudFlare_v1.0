-- Enable real-time for websites table
ALTER TABLE public.websites REPLICA IDENTITY FULL;

-- Add websites table to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'websites'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.websites;
  END IF;
END $$;

-- Migrate existing Facebook Pixel IDs from settings JSON to main column
UPDATE public.websites 
SET facebook_pixel_id = COALESCE(
  facebook_pixel_id, 
  settings->>'facebook_pixel_id'
)
WHERE settings->>'facebook_pixel_id' IS NOT NULL 
AND (facebook_pixel_id IS NULL OR facebook_pixel_id = '');

-- Migrate existing Google Analytics IDs from settings JSON to main column  
UPDATE public.websites 
SET google_analytics_id = COALESCE(
  google_analytics_id,
  settings->>'google_analytics_id'
)
WHERE settings->>'google_analytics_id' IS NOT NULL 
AND (google_analytics_id IS NULL OR google_analytics_id = '');

-- Migrate existing Google Ads IDs from settings JSON to main column
UPDATE public.websites 
SET google_ads_id = COALESCE(
  google_ads_id,
  settings->>'google_ads_id'  
)
WHERE settings->>'google_ads_id' IS NOT NULL 
AND (google_ads_id IS NULL OR google_ads_id = '');