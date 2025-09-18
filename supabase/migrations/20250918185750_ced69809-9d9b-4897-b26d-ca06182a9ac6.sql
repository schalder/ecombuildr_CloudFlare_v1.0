-- Create secure function to verify member credentials using pgcrypto
CREATE OR REPLACE FUNCTION public.verify_member_credentials(
  p_email text,
  p_password text,
  p_store_id uuid
)
RETURNS TABLE(
  member_id uuid,
  store_id uuid,
  email text,
  full_name text,
  phone text,
  is_active boolean,
  last_login_at timestamp with time zone,
  access_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  member_record public.member_accounts%ROWTYPE;
  password_valid boolean := false;
BEGIN
  -- Get member account
  SELECT * INTO member_record
  FROM public.member_accounts
  WHERE 
    public.member_accounts.email = lower(p_email)
    AND public.member_accounts.store_id = p_store_id
    AND public.member_accounts.is_active = true;

  -- If no member found, return empty result
  IF member_record.id IS NULL THEN
    RETURN;
  END IF;

  -- Verify password using pgcrypto crypt function
  -- This works with both bcrypt hashes and plaintext (for legacy accounts)
  BEGIN
    -- Try pgcrypto verification first (for properly hashed passwords)
    password_valid := (member_record.password_hash = crypt(p_password, member_record.password_hash));
    
    -- If that fails, try direct comparison for legacy plaintext passwords
    IF NOT password_valid THEN
      password_valid := (p_password = member_record.password_hash);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to direct comparison
    password_valid := (p_password = member_record.password_hash);
  END;

  -- If password is valid, return member data
  IF password_valid THEN
    RETURN QUERY SELECT
      member_record.id,
      member_record.store_id,
      member_record.email,
      member_record.full_name,
      member_record.phone,
      member_record.is_active,
      member_record.last_login_at,
      member_record.access_status;
  END IF;
END;
$$;