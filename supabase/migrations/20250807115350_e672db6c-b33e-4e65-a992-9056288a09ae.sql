-- Fix the function with proper search path
CREATE OR REPLACE FUNCTION public.set_homepage(page_uuid uuid)
RETURNS void 
SET search_path = ''
AS $$
DECLARE
  target_store_id uuid;
BEGIN
  -- Get the store_id for the target page
  SELECT store_id INTO target_store_id
  FROM public.pages
  WHERE id = page_uuid;
  
  IF target_store_id IS NULL THEN
    RAISE EXCEPTION 'Page not found';
  END IF;
  
  -- Check if user owns the store
  IF NOT public.is_store_owner(target_store_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Unset all other homepages for this store
  UPDATE public.pages
  SET is_homepage = false
  WHERE store_id = target_store_id AND is_homepage = true;
  
  -- Set the target page as homepage
  UPDATE public.pages
  SET is_homepage = true
  WHERE id = page_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;