-- Cleanup duplicate rows in platform_tracking_settings
-- Keep only the most recent row (or the one with a pixel ID if available)

-- First, if there's a row with a pixel ID, keep that one, otherwise keep the most recent
WITH ranked_rows AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE WHEN facebook_pixel_id IS NOT NULL AND facebook_pixel_id != '' THEN 0 ELSE 1 END,
        created_at DESC
    ) as rn
  FROM platform_tracking_settings
),
row_to_keep AS (
  SELECT id FROM ranked_rows WHERE rn = 1
)
DELETE FROM platform_tracking_settings
WHERE id NOT IN (SELECT id FROM row_to_keep);

-- Verify only one row exists
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM platform_tracking_settings;
  IF row_count > 1 THEN
    RAISE EXCEPTION 'Cleanup failed: % rows still exist (expected 1)', row_count;
  END IF;
END $$;

