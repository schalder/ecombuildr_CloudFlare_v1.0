-- Add SEO defaults to websites and funnels
ALTER TABLE public.websites
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS og_image text,
  ADD COLUMN IF NOT EXISTS meta_robots text,
  ADD COLUMN IF NOT EXISTS canonical_domain text;

ALTER TABLE public.funnels
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS og_image text,
  ADD COLUMN IF NOT EXISTS meta_robots text,
  ADD COLUMN IF NOT EXISTS canonical_domain text;