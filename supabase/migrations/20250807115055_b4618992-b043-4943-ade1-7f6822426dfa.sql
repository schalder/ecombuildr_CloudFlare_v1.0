-- Fix the typo in the slug
UPDATE pages 
SET slug = 'single-product' 
WHERE slug = 'signle-product';

-- Ensure only one homepage exists - the one with empty slug should be the homepage
UPDATE pages 
SET is_homepage = false 
WHERE slug = 'single-product';

UPDATE pages 
SET is_homepage = true 
WHERE slug = '';

-- Add unique constraint to prevent multiple homepages (without CONCURRENTLY)
CREATE UNIQUE INDEX idx_unique_homepage_per_store 
ON pages (store_id) 
WHERE is_homepage = true;