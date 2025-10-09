-- Add iframe_embed_code column to platform_marketing_content table
-- This allows storing custom iframe embed codes for video players

ALTER TABLE public.platform_marketing_content 
ADD COLUMN IF NOT EXISTS iframe_embed_code text;

-- Add comment to explain the column
COMMENT ON COLUMN public.platform_marketing_content.iframe_embed_code IS 'Custom iframe embed code for video players (alternative to youtube_url)';

-- Update the existing hero record to have null iframe_embed_code
UPDATE public.platform_marketing_content 
SET iframe_embed_code = NULL 
WHERE section = 'hero' AND iframe_embed_code IS NULL;
