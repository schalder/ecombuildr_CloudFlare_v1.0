-- Create function to get accessible courses for a member
CREATE OR REPLACE FUNCTION public.get_member_accessible_courses(p_member_account_id uuid)
RETURNS TABLE(
  course_id uuid,
  course_title text,
  course_description text,
  course_thumbnail_url text,
  course_price numeric,
  access_granted_at timestamp with time zone,
  access_expires_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.thumbnail_url,
    c.price,
    cma.granted_at,
    cma.expires_at
  FROM courses c
  INNER JOIN course_member_access cma ON c.id = cma.course_id
  WHERE cma.member_account_id = p_member_account_id
    AND cma.is_active = true
    AND c.is_published = true
    AND c.is_active = true
    AND (cma.expires_at IS NULL OR cma.expires_at > now());
END;
$$;

-- Create function to verify member access to a specific course
CREATE OR REPLACE FUNCTION public.verify_member_course_access(p_member_account_id uuid, p_course_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  has_access boolean := false;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM course_member_access cma
    INNER JOIN courses c ON c.id = cma.course_id
    WHERE cma.member_account_id = p_member_account_id
      AND cma.course_id = p_course_id
      AND cma.is_active = true
      AND c.is_published = true
      AND c.is_active = true
      AND (cma.expires_at IS NULL OR cma.expires_at > now())
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;