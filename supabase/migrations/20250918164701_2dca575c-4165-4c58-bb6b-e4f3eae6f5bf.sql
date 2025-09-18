-- Fix the course order completion trigger to create member accounts

-- First, create a function to create member accounts for course orders
CREATE OR REPLACE FUNCTION public.create_member_account_for_course_order()
RETURNS TRIGGER AS $$
DECLARE
  has_course_product boolean := false;
  member_account_record public.member_accounts%rowtype;
  generated_password text;
BEGIN
  -- Only process delivered orders
  IF NEW.payment_status != 'completed' OR OLD.payment_status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Check if order is for a course (course_orders table means it's always a course)
  has_course_product := true;

  IF NOT has_course_product THEN
    RETURN NEW;
  END IF;

  -- Generate random password (8 characters)
  generated_password := substring(md5(random()::text) from 1 for 8);

  -- Create or get member account using explicit schema for pgcrypto functions
  INSERT INTO public.member_accounts (
    store_id, email, password_hash, full_name, phone
  ) VALUES (
    NEW.store_id,
    NEW.customer_email,
    public.crypt(generated_password, public.gen_salt('bf')),
    NEW.customer_name,
    NEW.customer_phone
  )
  ON CONFLICT (store_id, email) 
  DO UPDATE SET 
    full_name = COALESCE(member_accounts.full_name, NEW.customer_name),
    phone = COALESCE(member_accounts.phone, NEW.customer_phone),
    updated_at = now()
  RETURNING * INTO member_account_record;

  -- Grant access to the purchased course
  INSERT INTO public.course_member_access (
    member_account_id, course_id, course_order_id
  ) VALUES (
    member_account_record.id,
    NEW.course_id,
    NEW.id
  )
  ON CONFLICT (member_account_id, course_id) DO NOTHING;

  -- Store password in order metadata for email sending
  UPDATE public.course_orders 
  SET metadata = COALESCE(metadata, '{}'::jsonb) || 
    jsonb_build_object('member_password', generated_password)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;