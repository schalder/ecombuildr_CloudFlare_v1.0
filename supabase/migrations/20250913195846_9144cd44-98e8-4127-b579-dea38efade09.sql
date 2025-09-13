-- Add parent_category_id to categories table for subcategory support
ALTER TABLE public.categories 
ADD COLUMN parent_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;

-- Add index for better performance on hierarchical queries
CREATE INDEX idx_categories_parent_id ON public.categories(parent_category_id);

-- Create function to get category hierarchy
CREATE OR REPLACE FUNCTION public.get_category_hierarchy(store_uuid uuid)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  description text,
  image_url text,
  parent_category_id uuid,
  parent_name text,
  level integer,
  full_path text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE category_tree AS (
    -- Base case: root categories (no parent)
    SELECT 
      c.id,
      c.name,
      c.slug,
      c.description,
      c.image_url,
      c.parent_category_id,
      NULL::text as parent_name,
      0 as level,
      c.name as full_path
    FROM public.categories c
    WHERE c.store_id = store_uuid AND c.parent_category_id IS NULL
    
    UNION ALL
    
    -- Recursive case: subcategories
    SELECT 
      c.id,
      c.name,
      c.slug,
      c.description,
      c.image_url,
      c.parent_category_id,
      ct.name as parent_name,
      ct.level + 1,
      ct.full_path || ' > ' || c.name as full_path
    FROM public.categories c
    INNER JOIN category_tree ct ON c.parent_category_id = ct.id
    WHERE c.store_id = store_uuid
  )
  SELECT 
    category_tree.id,
    category_tree.name,
    category_tree.slug,
    category_tree.description,
    category_tree.image_url,
    category_tree.parent_category_id,
    category_tree.parent_name,
    category_tree.level,
    category_tree.full_path
  FROM category_tree
  ORDER BY category_tree.level, category_tree.name;
END;
$$;

-- Function to prevent circular references
CREATE OR REPLACE FUNCTION public.check_category_circular_reference()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if trying to set parent as itself
  IF NEW.parent_category_id = NEW.id THEN
    RAISE EXCEPTION 'Category cannot be its own parent';
  END IF;
  
  -- Check for circular reference by walking up the tree
  IF NEW.parent_category_id IS NOT NULL THEN
    WITH RECURSIVE parent_check AS (
      SELECT parent_category_id FROM public.categories WHERE id = NEW.parent_category_id
      UNION ALL
      SELECT c.parent_category_id 
      FROM public.categories c
      INNER JOIN parent_check pc ON c.id = pc.parent_category_id
      WHERE c.parent_category_id IS NOT NULL
    )
    SELECT 1 FROM parent_check WHERE parent_category_id = NEW.id;
    
    IF FOUND THEN
      RAISE EXCEPTION 'Circular reference detected in category hierarchy';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check circular references
CREATE TRIGGER check_category_circular_reference_trigger
BEFORE INSERT OR UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.check_category_circular_reference();