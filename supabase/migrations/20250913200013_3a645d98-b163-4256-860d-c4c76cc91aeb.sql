-- Fix the search path security warning by making the function stable and setting search_path
DROP FUNCTION IF EXISTS public.get_category_hierarchy(uuid);

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
STABLE
SECURITY DEFINER
SET search_path = 'public'
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