-- Ensure pgcrypto is available for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop and recreate credential verification with clean return type
DROP FUNCTION IF EXISTS public.verify_member_credentials(text, text, uuid);
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

-- Remove legacy triggers and functions that duplicate logic
DROP FUNCTION IF EXISTS public.create_member_account_for_course_order() CASCADE;
DROP FUNCTION IF EXISTS public.update_member_access_on_payment() CASCADE;

-- Simple account creation or update with plain inputs (no bcrypt)
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
  v_member_id uuid;
  v_email text;
BEGIN
  v_email := lower(trim(p_email));

  -- find existing account (case-insensitive)
  SELECT id INTO v_member_id
  FROM public.member_accounts
  WHERE store_id = p_store_id AND lower(email) = v_email
  LIMIT 1;

  IF v_member_id IS NULL THEN
    INSERT INTO public.member_accounts (
      store_id, email, password_hash, full_name, phone, access_status, is_active
    ) VALUES (
      p_store_id, v_email, crypt(p_password, gen_salt('bf')), p_full_name, p_phone, 'active', true
    ) RETURNING id INTO v_member_id;
  ELSE
    UPDATE public.member_accounts
    SET 
      password_hash = crypt(p_password, gen_salt('bf')),
      full_name = COALESCE(p_full_name, full_name),
      phone = COALESCE(p_phone, phone),
      access_status = 'active',
      is_active = true,
      updated_at = now()
    WHERE id = v_member_id;
  END IF;

  RETURN v_member_id;
END;
$$;

-- Simple idempotent grant for course access
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
  v_access_id uuid;
BEGIN
  SELECT id INTO v_access_id
  FROM public.course_member_access
  WHERE member_account_id = p_member_account_id AND course_id = p_course_id
  LIMIT 1;

  IF v_access_id IS NULL THEN
    INSERT INTO public.course_member_access (
      member_account_id, course_id, course_order_id, access_status, is_active
    ) VALUES (
      p_member_account_id, p_course_id, p_course_order_id, 'active', true
    ) RETURNING id INTO v_access_id;
  ELSE
    UPDATE public.course_member_access
    SET access_status = 'active', is_active = true, updated_at = now()
    WHERE id = v_access_id;
  END IF;

  RETURN v_access_id;
END;
$$;