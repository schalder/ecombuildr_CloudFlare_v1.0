-- Phase 1: Clean up orphaned data and fix category database constraints

-- Step 1: Clean up orphaned category_website_visibility records
DELETE FROM public.category_website_visibility 
WHERE category_id NOT IN (SELECT id FROM public.categories);

-- Step 2: Clean up orphaned category_website_visibility records for non-existent websites
DELETE FROM public.category_website_visibility 
WHERE website_id NOT IN (SELECT id FROM public.websites);

-- Step 3: Drop the problematic unique constraint that prevents same category names across different websites
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_store_id_slug_key;

-- Step 4: Add a non-unique index for performance on store_id and slug lookups
CREATE INDEX IF NOT EXISTS idx_categories_store_id_slug ON public.categories(store_id, slug);

-- Step 5: Ensure category_website_visibility has proper foreign keys with cascade delete
ALTER TABLE public.category_website_visibility 
DROP CONSTRAINT IF EXISTS category_website_visibility_category_id_fkey;

ALTER TABLE public.category_website_visibility 
DROP CONSTRAINT IF EXISTS category_website_visibility_website_id_fkey;

ALTER TABLE public.category_website_visibility
ADD CONSTRAINT category_website_visibility_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;

ALTER TABLE public.category_website_visibility
ADD CONSTRAINT category_website_visibility_website_id_fkey 
FOREIGN KEY (website_id) REFERENCES public.websites(id) ON DELETE CASCADE;

-- Step 6: Ensure each category belongs to exactly one website
ALTER TABLE public.category_website_visibility 
DROP CONSTRAINT IF EXISTS category_website_visibility_category_id_key;

-- Step 7: Remove duplicate category-website associations (keep the first one)
DELETE FROM public.category_website_visibility 
WHERE id NOT IN (
  SELECT DISTINCT ON (category_id) id 
  FROM public.category_website_visibility 
  ORDER BY category_id, created_at ASC
);

-- Step 8: Add unique constraint after cleanup
ALTER TABLE public.category_website_visibility 
ADD CONSTRAINT category_website_visibility_category_id_key UNIQUE (category_id);