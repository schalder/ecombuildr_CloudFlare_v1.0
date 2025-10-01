-- Create RPC function to check slug availability globally (bypassing RLS)
-- This allows users to check if a slug is taken across all stores/users

CREATE OR REPLACE FUNCTION public.slug_is_available(content_type text, slug_value text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check based on content type
  IF content_type = 'website' THEN
    RETURN NOT EXISTS (
      SELECT 1 FROM public.websites WHERE slug = slug_value
    );
  ELSIF content_type = 'funnel' THEN
    RETURN NOT EXISTS (
      SELECT 1 FROM public.funnels WHERE slug = slug_value
    );
  ELSE
    RAISE EXCEPTION 'Invalid content_type. Must be "website" or "funnel"';
  END IF;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.slug_is_available(text, text) TO anon, authenticated;