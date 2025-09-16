-- Add password verification function
CREATE OR REPLACE FUNCTION public.verify_member_password(input_password text, stored_hash text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT crypt(input_password, stored_hash) = stored_hash;
$$;