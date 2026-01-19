-- Add hide_header and hide_footer columns to website_pages table
-- These columns allow individual pages to hide the global header/footer
ALTER TABLE public.website_pages
ADD COLUMN IF NOT EXISTS hide_header BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_footer BOOLEAN NOT NULL DEFAULT false;

-- Add comment to explain the columns
COMMENT ON COLUMN public.website_pages.hide_header IS 'When true, hides the global website header on this specific page';
COMMENT ON COLUMN public.website_pages.hide_footer IS 'When true, hides the global website footer on this specific page';
