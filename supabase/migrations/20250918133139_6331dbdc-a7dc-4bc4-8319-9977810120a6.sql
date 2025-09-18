-- Fix PostgreSQL 17 type casting issues in course order functions

-- Update handle_course_order_payment function with proper type casting
CREATE OR REPLACE FUNCTION public.handle_course_order_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  generated_password text;
  member_account_record public.member_accounts%rowtype;
BEGIN
  -- Only process delivered orders (first transition to delivered)
  IF TG_OP = 'UPDATE' 
     AND NEW.payment_status = 'completed' 
     AND (OLD.payment_status IS DISTINCT FROM 'completed') THEN

    -- Generate random password (8 characters)
    generated_password := substring(md5(random()::text) from 1 for 8);

    -- Create or get member account
    INSERT INTO public.member_accounts (
      store_id, email, password_hash, full_name, phone, access_status
    ) VALUES (
      NEW.store_id,
      NEW.customer_email,
      crypt(generated_password::text, gen_salt('bf'::text)),
      NEW.customer_name,
      NEW.customer_phone,
      'active'
    )
    ON CONFLICT (store_id, email) 
    DO UPDATE SET 
      full_name = COALESCE(member_accounts.full_name, NEW.customer_name),
      phone = COALESCE(member_accounts.phone, NEW.customer_phone),
      access_status = 'active',
      updated_at = now()
    RETURNING * INTO member_account_record;

    -- Grant access to the purchased course
    INSERT INTO public.course_member_access (
      member_account_id, course_id, course_order_id, access_status
    ) VALUES (
      member_account_record.id,
      NEW.course_id,
      NEW.id,
      'active'
    )
    ON CONFLICT (member_account_id, course_id) 
    DO UPDATE SET 
      access_status = 'active',
      course_order_id = NEW.id,
      updated_at = now();

    -- Store password in order metadata for email sending
    UPDATE public.course_orders 
    SET metadata = COALESCE(metadata, '{}'::jsonb) || 
      jsonb_build_object('member_password', generated_password)
    WHERE id = NEW.id;

  END IF;

  RETURN NEW;
END;
$function$;

-- Update create_member_account_for_course_order function with proper type casting
CREATE OR REPLACE FUNCTION public.create_member_account_for_course_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  member_account_record public.member_accounts%rowtype;
  generated_password text;
BEGIN
  -- Only process completed orders (first transition to completed)
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS DISTINCT FROM 'completed') THEN

    -- Generate random password (8 characters)
    generated_password := substring(md5(random()::text) from 1 for 8);

    -- Create or get member account
    INSERT INTO public.member_accounts (
      store_id, email, password_hash, full_name, phone, access_status
    ) VALUES (
      NEW.store_id,
      NEW.customer_email,
      crypt(generated_password::text, gen_salt('bf'::text)),
      NEW.customer_name,
      NEW.customer_phone,
      'active'
    )
    ON CONFLICT (store_id, email) 
    DO UPDATE SET 
      full_name = COALESCE(member_accounts.full_name, NEW.customer_name),
      phone = COALESCE(member_accounts.phone, NEW.customer_phone),
      access_status = 'active',
      updated_at = now()
    RETURNING * INTO member_account_record;

    -- Grant access to the purchased course
    INSERT INTO public.course_member_access (
      member_account_id, course_id, course_order_id, access_status
    ) VALUES (
      member_account_record.id,
      NEW.course_id,
      NEW.id,
      'active'
    )
    ON CONFLICT (member_account_id, course_id) 
    DO UPDATE SET 
      access_status = 'active',
      course_order_id = NEW.id,
      updated_at = now();

    -- Store password in order metadata for email sending
    UPDATE public.course_orders 
    SET metadata = COALESCE(metadata, '{}'::jsonb) || 
      jsonb_build_object('member_password', generated_password)
    WHERE id = NEW.id;

  END IF;

  RETURN NEW;
END;
$function$;