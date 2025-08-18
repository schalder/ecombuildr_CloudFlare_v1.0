-- Add support for per-page HTML snapshots
-- Update the unique constraint to include page-level snapshots

-- First, let's add an index for faster queries on the new structure
CREATE INDEX IF NOT EXISTS idx_html_snapshots_content_lookup 
ON html_snapshots(content_type, content_id, custom_domain);

-- Add a comment to document the new content_type values
COMMENT ON COLUMN html_snapshots.content_type IS 'Content type: website, funnel, website_page, or funnel_step';
COMMENT ON COLUMN html_snapshots.content_id IS 'ID of the content: website.id, funnel.id, website_pages.id, or funnel_steps.id';

-- The existing unique constraint should handle the new per-page structure
-- No changes needed to the table structure as it already supports our use case