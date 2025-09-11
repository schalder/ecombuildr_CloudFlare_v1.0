-- Create admin function to delete website and all related data
CREATE OR REPLACE FUNCTION public.delete_website_admin(p_website_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only super admins can call this function
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: super admin required';
  END IF;

  -- Delete all related data in correct order to avoid foreign key constraints
  
  -- Delete website page related data
  DELETE FROM public.html_snapshots 
  WHERE content_type = 'website_page' 
    AND content_id IN (
      SELECT id FROM public.website_pages WHERE website_id = p_website_id
    );

  DELETE FROM public.domain_connections 
  WHERE content_type = 'website_page' 
    AND content_id IN (
      SELECT id FROM public.website_pages WHERE website_id = p_website_id
    );

  -- Delete website pages
  DELETE FROM public.website_pages WHERE website_id = p_website_id;

  -- Delete collection items and collections
  DELETE FROM public.product_collection_items 
  WHERE collection_id IN (
    SELECT id FROM public.collections WHERE website_id = p_website_id
  );

  DELETE FROM public.collections WHERE website_id = p_website_id;

  -- Delete product/category visibility for this website
  DELETE FROM public.product_website_visibility WHERE website_id = p_website_id;
  DELETE FROM public.category_website_visibility WHERE website_id = p_website_id;

  -- Delete website analytics and pixel events
  DELETE FROM public.website_analytics WHERE website_id = p_website_id;
  DELETE FROM public.pixel_events WHERE website_id = p_website_id;

  -- Delete domain connections pointing to this website
  DELETE FROM public.domain_connections 
  WHERE content_type = 'website' AND content_id = p_website_id;

  -- Delete HTML snapshots for this website
  DELETE FROM public.html_snapshots 
  WHERE content_type = 'website' AND content_id = p_website_id;

  -- Finally delete the website itself
  DELETE FROM public.websites WHERE id = p_website_id;
END;
$function$;