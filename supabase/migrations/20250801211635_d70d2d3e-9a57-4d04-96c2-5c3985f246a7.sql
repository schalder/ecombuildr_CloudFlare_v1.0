-- Fix homepage to have empty slug
UPDATE pages 
SET slug = '' 
WHERE is_homepage = true;