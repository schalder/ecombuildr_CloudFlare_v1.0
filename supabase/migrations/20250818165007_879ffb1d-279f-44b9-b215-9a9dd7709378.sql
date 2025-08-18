-- Remove website-level SEO columns from websites table
ALTER TABLE websites 
DROP COLUMN IF EXISTS seo_title,
DROP COLUMN IF EXISTS seo_description,
DROP COLUMN IF EXISTS og_image,
DROP COLUMN IF EXISTS meta_robots,
DROP COLUMN IF EXISTS canonical_domain,
DROP COLUMN IF EXISTS seo_keywords;