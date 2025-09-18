-- Fix verify_member_credentials function with proper search_path and case-insensitive email
CREATE OR REPLACE FUNCTION public.verify_member_credentials(
  p_email text,
  p_password text,
  p_store_id uuid
)
RETURNS TABLE(
  id uuid,
  store_id uuid,
  email text,
  full_name text,
  phone text,
  access_status text,
  is_active boolean,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ma.id,
    ma.store_id,
    ma.email,
    ma.full_name,
    ma.phone,
    ma.access_status,
    ma.is_active,
    ma.last_login_at,
    ma.created_at,
    ma.updated_at
  FROM public.member_accounts ma
  WHERE lower(ma.email) = lower(p_email)
    AND ma.store_id = p_store_id
    AND ma.is_active = true
    AND crypt(p_password, ma.password_hash) = ma.password_hash;
END;
$$;

-- Remove conflicting triggers and functions
DROP TRIGGER IF EXISTS create_member_account_for_course_order_trigger ON public.course_orders;
DROP FUNCTION IF EXISTS public.create_member_account_for_course_order();

DROP TRIGGER IF EXISTS update_member_access_on_payment_trigger ON public.course_orders;
DROP FUNCTION IF EXISTS public.update_member_access_on_payment();

-- Create simplified function for member account creation with course access
CREATE OR REPLACE FUNCTION public.create_member_account_with_password(
  p_store_id uuid,
  p_email text,
  p_password text,
  p_full_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_course_order_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  member_id uuid;
  hashed_password text;
BEGIN
  -- Hash the password using pgcrypto
  SELECT crypt(p_password, gen_salt('bf')) INTO hashed_password;
  
  -- Insert or update member account
  INSERT INTO public.member_accounts (
    store_id,
    email,
    password_hash,
    full_name,
    phone,
    access_status,
    is_active
  ) VALUES (
    p_store_id,
    p_email,
    hashed_password,
    p_full_name,
    p_phone,
    'active',
    true
  )
  ON CONFLICT (store_id, email) 
  DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name = COALESCE(EXCLUDED.full_name, member_accounts.full_name),
    phone = COALESCE(EXCLUDED.phone, member_accounts.phone),
    access_status = 'active',
    is_active = true,
    updated_at = now()
  RETURNING id INTO member_id;
  
  RETURN member_id;
END;
$$;

-- Create simplified function for granting course access
CREATE OR REPLACE FUNCTION public.grant_course_access(
  p_member_account_id uuid,
  p_course_id uuid,
  p_course_order_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  access_id uuid;
BEGIN
  -- Insert course access
  INSERT INTO public.course_member_access (
    member_account_id,
    course_id,
    course_order_id,
    access_status,
    is_active
  ) VALUES (
    p_member_account_id,
    p_course_id,
    p_course_order_id,
    'active',
    true
  )
  ON CONFLICT (member_account_id, course_id)
  DO UPDATE SET
    access_status = 'active',
    is_active = true,
    updated_at = now()
  RETURNING id INTO access_id;
  
  RETURN access_id;
END;
$$;