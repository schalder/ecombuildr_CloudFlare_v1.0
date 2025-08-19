
-- 1) Drop the overly restrictive CHECK constraint
ALTER TABLE public.html_snapshots
  DROP CONSTRAINT IF EXISTS html_snapshots_content_type_check;

-- 2) Recreate it with the full set of allowed content types
ALTER TABLE public.html_snapshots
  ADD CONSTRAINT html_snapshots_content_type_check
  CHECK (content_type IN ('website', 'funnel', 'website_page', 'funnel_step'));

-- 3) Ensure a uniqueness guarantee is in place for (content_id, content_type, custom_domain)
--    (This already exists in your project, but keep as safety with IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS idx_html_snapshots_unique
  ON public.html_snapshots (content_id, content_type, COALESCE(custom_domain, ''));
