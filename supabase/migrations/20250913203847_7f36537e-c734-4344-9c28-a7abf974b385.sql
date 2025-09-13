-- Fix check_category_circular_reference to avoid "query has no destination for result data"
-- Use an IF EXISTS check instead of PERFORM which has compatibility issues
CREATE OR REPLACE FUNCTION public.check_category_circular_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  has_circular_ref boolean := false;
BEGIN
  -- Check if trying to set parent as itself
  IF NEW.parent_category_id = NEW.id THEN
    RAISE EXCEPTION 'Category cannot be its own parent';
  END IF;
  
  -- Check for circular reference by walking up the tree
  IF NEW.parent_category_id IS NOT NULL THEN
    -- Check if category being edited is already in the hierarchy path
    WITH RECURSIVE parent_check AS (
      SELECT parent_category_id FROM public.categories WHERE id = NEW.parent_category_id
      UNION ALL
      SELECT c.parent_category_id 
      FROM public.categories c
      INNER JOIN parent_check pc ON c.id = pc.parent_category_id
      WHERE c.parent_category_id IS NOT NULL
    )
    SELECT EXISTS (
      SELECT 1 FROM parent_check WHERE parent_category_id = NEW.id
    ) INTO has_circular_ref;
    
    IF has_circular_ref THEN
      RAISE EXCEPTION 'Circular reference detected in category hierarchy';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;