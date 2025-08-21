-- Phase 2: Add trigger functions to enforce unique category slugs per website

-- Create trigger function to enforce unique category slugs per website
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create triggers to enforce unique slugs per website
DROP TRIGGER IF EXISTS enforce_unique_category_slug_per_website_on_visibility ON public.category_website_visibility;
CREATE TRIGGER enforce_unique_category_slug_per_website_on_visibility
  BEFORE INSERT OR UPDATE ON public.category_website_visibility
  FOR EACH ROW EXECUTE FUNCTION enforce_unique_category_slug_per_website();

DROP TRIGGER IF EXISTS enforce_unique_category_slug_per_website_on_categories ON public.categories;
CREATE TRIGGER enforce_unique_category_slug_per_website_on_categories
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION enforce_unique_category_slug_per_website();