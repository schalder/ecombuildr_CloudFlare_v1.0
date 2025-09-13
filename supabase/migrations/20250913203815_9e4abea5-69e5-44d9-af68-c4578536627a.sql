-- Fix check_category_circular_reference to avoid "query has no destination for result data"
CREATE OR REPLACE FUNCTION public.check_category_circular_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
    PERFORM 1 FROM parent_check WHERE parent_category_id = NEW.id;
    
    IF FOUND THEN
      RAISE EXCEPTION 'Circular reference detected in category hierarchy';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;