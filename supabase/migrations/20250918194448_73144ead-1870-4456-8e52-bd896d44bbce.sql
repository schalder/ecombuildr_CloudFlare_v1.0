-- Create function to verify member credentials without requiring store ID
CREATE OR REPLACE FUNCTION public.verify_member_credentials_any_store(p_email text, p_password text)
RETURNS TABLE(
  id uuid,
  store_id uuid,
  email text,
  full_name text,
  phone text,
  is_active boolean,
  access_status text,
  last_login_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ma.id,
    ma.store_id,
    ma.email,
    ma.full_name,
    ma.phone,
    ma.is_active,
    ma.access_status,
    ma.last_login_at
  FROM member_accounts ma
  WHERE lower(ma.email) = lower(p_email)
    AND ma.password_hash = p_password
    AND ma.is_active = true
    AND ma.access_status = 'active'
  LIMIT 1;
END;
$$;