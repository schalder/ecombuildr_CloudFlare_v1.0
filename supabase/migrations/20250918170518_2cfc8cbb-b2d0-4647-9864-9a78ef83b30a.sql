-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to create member account with password
CREATE OR REPLACE FUNCTION public.create_member_account_with_password(
  p_store_id uuid,
  p_email text,
  p_password text,
  p_full_name text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  member_id uuid;
BEGIN
  -- Create or get member account
  INSERT INTO public.member_accounts (
    store_id, email, password_hash, full_name, phone, is_active
  ) VALUES (
    p_store_id,
    p_email,
    crypt(p_password, gen_salt('bf')),
    p_full_name,
    p_phone,
    true
  )
  ON CONFLICT (store_id, email) 
  DO UPDATE SET 
    password_hash = crypt(p_password, gen_salt('bf')),
    full_name = COALESCE(member_accounts.full_name, p_full_name),
    phone = COALESCE(member_accounts.phone, p_phone),
    is_active = true,
    updated_at = now()
  RETURNING id INTO member_id;

  RETURN member_id;
END;
$$;

-- Function to grant course access to member
CREATE OR REPLACE FUNCTION public.grant_course_access(
  p_member_account_id uuid,
  p_course_id uuid,
  p_course_order_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  access_id uuid;
BEGIN
  -- Grant course access
  INSERT INTO public.course_member_access (
    member_account_id, course_id, course_order_id, access_status, is_active
  ) VALUES (
    p_member_account_id,
    p_course_id,
    p_course_order_id,
    'active',
    true
  )
  ON CONFLICT (member_account_id, course_id) 
  DO UPDATE SET 
    course_order_id = COALESCE(course_member_access.course_order_id, p_course_order_id),
    access_status = 'active',
    is_active = true,
    updated_at = now()
  RETURNING id INTO access_id;

  RETURN access_id;
END;
$$;