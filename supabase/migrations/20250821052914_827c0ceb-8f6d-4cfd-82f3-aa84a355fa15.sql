-- Phase 1: Database Schema Fixes for Category Management

-- Step 1: Drop the problematic unique constraint that prevents same category names across different websites
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_store_id_slug_key;

-- Step 2: Add a non-unique index for performance on store_id and slug lookups
CREATE INDEX IF NOT EXISTS idx_categories_store_id_slug ON public.categories(store_id, slug);

-- Step 3: Ensure category_website_visibility has proper foreign keys with cascade delete
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

-- Step 4: Ensure each category belongs to exactly one website
ALTER TABLE public.category_website_visibility 
DROP CONSTRAINT IF EXISTS category_website_visibility_category_id_key;

ALTER TABLE public.category_website_visibility 
ADD CONSTRAINT category_website_visibility_category_id_key UNIQUE (category_id);

-- Step 5: Data cleanup - remove duplicate category-website associations (keep the first one)
DELETE FROM public.category_website_visibility 
WHERE id NOT IN (
  SELECT DISTINCT ON (category_id) id 
  FROM public.category_website_visibility 
  ORDER BY category_id, created_at ASC
);

-- Step 6: Create trigger function to enforce unique category slugs per website
CREATE OR REPLACE FUNCTION enforce_unique_category_slug_per_website()
RETURNS TRIGGER AS $$
DECLARE
  target_website_id uuid;
  existing_category_id uuid;
BEGIN
  -- For category_website_visibility table operations
  IF TG_TABLE_NAME = 'category_website_visibility' THEN
    target_website_id := NEW.website_id;
    
    -- Check if another category with the same slug already exists for this website
    SELECT c.id INTO existing_category_id
    FROM public.categories c
    JOIN public.category_website_visibility cwv ON c.id = cwv.category_id
    WHERE cwv.website_id = target_website_id 
      AND c.slug = (SELECT slug FROM public.categories WHERE id = NEW.category_id)
      AND c.id != NEW.category_id;
      
    IF existing_category_id IS NOT NULL THEN
      RAISE EXCEPTION 'A category with this name already exists for this website';
    END IF;
    
  -- For categories table operations
  ELSIF TG_TABLE_NAME = 'categories' THEN
    -- Get the website this category is associated with
    SELECT website_id INTO target_website_id
    FROM public.category_website_visibility
    WHERE category_id = NEW.id;
    
    -- If category is associated with a website, check for slug conflicts
    IF target_website_id IS NOT NULL THEN
      SELECT c.id INTO existing_category_id
      FROM public.categories c
      JOIN public.category_website_visibility cwv ON c.id = cwv.category_id
      WHERE cwv.website_id = target_website_id 
        AND c.slug = NEW.slug
        AND c.id != NEW.id;
        
      IF existing_category_id IS NOT NULL THEN
        RAISE EXCEPTION 'A category with this name already exists for this website';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create triggers to enforce unique slugs per website
DROP TRIGGER IF EXISTS enforce_unique_category_slug_per_website_on_visibility ON public.category_website_visibility;
CREATE TRIGGER enforce_unique_category_slug_per_website_on_visibility
  BEFORE INSERT OR UPDATE ON public.category_website_visibility
  FOR EACH ROW EXECUTE FUNCTION enforce_unique_category_slug_per_website();

DROP TRIGGER IF EXISTS enforce_unique_category_slug_per_website_on_categories ON public.categories;
CREATE TRIGGER enforce_unique_category_slug_per_website_on_categories
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION enforce_unique_category_slug_per_website();