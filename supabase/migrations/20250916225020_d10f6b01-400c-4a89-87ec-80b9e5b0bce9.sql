-- Extend domain_connections to support course content types
-- Add check constraint to allow new course-related content types
ALTER TABLE public.domain_connections 
DROP CONSTRAINT IF EXISTS domain_connections_content_type_check;

ALTER TABLE public.domain_connections 
ADD CONSTRAINT domain_connections_content_type_check 
CHECK (content_type IN ('website', 'funnel', 'funnel_step', 'website_page', 'course_area', 'course_library', 'course_detail'));

-- Add unique constraint for course slug per domain to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_domain_course_slug_unique 
ON public.domain_connections (domain_id, path) 
WHERE content_type IN ('course_detail', 'course_area', 'course_library');

-- Function to check course slug availability on a domain
CREATE OR REPLACE FUNCTION public.check_course_slug_availability(
  p_domain_id uuid,
  p_slug text,
  p_exclude_connection_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if slug is already used on this domain
  RETURN NOT EXISTS (
    SELECT 1 FROM public.domain_connections
    WHERE domain_id = p_domain_id 
      AND path = p_slug
      AND content_type IN ('course_detail', 'course_area', 'course_library', 'website', 'funnel')
      AND (p_exclude_connection_id IS NULL OR id != p_exclude_connection_id)
  );
END;
$$;