-- Supabase RPC function to get content data for SEO
CREATE OR REPLACE FUNCTION get_content_data(
  content_type TEXT,
  store_slug TEXT,
  page_slug TEXT DEFAULT NULL,
  funnel_slug TEXT DEFAULT NULL,
  step_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  title TEXT,
  description TEXT,
  seo_image TEXT,
  store_name TEXT,
  store_slug TEXT,
  funnel_name TEXT,
  funnel_slug TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  CASE content_type
    WHEN 'website_page' THEN
      RETURN QUERY
      SELECT 
        wp.title,
        wp.description,
        wp.seo_image,
        ws.store_name,
        ws.store_slug,
        NULL::TEXT as funnel_name,
        NULL::TEXT as funnel_slug
      FROM website_pages wp
      JOIN websites ws ON wp.website_id = ws.id
      WHERE ws.store_slug = get_content_data.store_slug 
        AND wp.slug = get_content_data.page_slug;
        
    WHEN 'funnel_step' THEN
      RETURN QUERY
      SELECT 
        fs.title,
        fs.description,
        fs.seo_image,
        ws.store_name,
        ws.store_slug,
        f.funnel_name,
        f.funnel_slug
      FROM funnel_steps fs
      JOIN funnels f ON fs.funnel_id = f.id
      JOIN websites ws ON f.website_id = ws.id
      WHERE ws.store_slug = get_content_data.store_slug 
        AND f.funnel_slug = get_content_data.funnel_slug 
        AND fs.slug = get_content_data.step_slug;
        
    WHEN 'website_home' THEN
      RETURN QUERY
      SELECT 
        ws.store_name as title,
        ws.store_description as description,
        ws.store_logo as seo_image,
        ws.store_name,
        ws.store_slug,
        NULL::TEXT as funnel_name,
        NULL::TEXT as funnel_slug
      FROM websites ws
      WHERE ws.store_slug = get_content_data.store_slug;
      
    WHEN 'funnel_home' THEN
      RETURN QUERY
      SELECT 
        f.funnel_name as title,
        f.funnel_description as description,
        f.funnel_image as seo_image,
        ws.store_name,
        ws.store_slug,
        f.funnel_name,
        f.funnel_slug
      FROM funnels f
      JOIN websites ws ON f.website_id = ws.id
      WHERE ws.store_slug = get_content_data.store_slug 
        AND f.funnel_slug = get_content_data.funnel_slug;
        
    ELSE
      RETURN;
  END CASE;
END;
$$;
