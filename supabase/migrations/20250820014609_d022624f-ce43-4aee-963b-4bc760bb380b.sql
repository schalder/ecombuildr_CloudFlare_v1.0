
-- 1) Add columns
ALTER TABLE public.page_templates
  ADD COLUMN IF NOT EXISTS auto_generate_preview boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS template_types text[] NOT NULL DEFAULT '{}';

-- 2) Backfill template_types from legacy template_type
UPDATE public.page_templates
SET template_types = ARRAY[template_type]
WHERE (template_types IS NULL OR array_length(template_types, 1) IS NULL)
  AND template_type IS NOT NULL;

-- 3) Optional: ensure values are limited to known types (soft enforcement at app layer)
-- You can keep this out if you prefer flexibility. Shown here commented for reference.
-- ALTER TABLE public.page_templates
--   ADD CONSTRAINT template_types_allowed_values
--   CHECK (
--     NOT EXISTS (
--       SELECT 1
--       FROM unnest(template_types) t(v)
--       WHERE v NOT IN ('website_page', 'funnel_step')
--     )
--   );

-- 4) Index for better filtering with contains/overlaps
CREATE INDEX IF NOT EXISTS idx_page_templates_template_types_gin
  ON public.page_templates
  USING GIN (template_types);
