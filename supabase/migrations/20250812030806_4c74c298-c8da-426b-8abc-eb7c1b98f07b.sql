-- Add video_url to products for product media video support
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- No changes needed to RLS since it inherits existing policies for products
-- Optional: comment for documentation
COMMENT ON COLUMN public.products.video_url IS 'Optional product video URL (YouTube/Vimeo/Wistia/direct MP4)';