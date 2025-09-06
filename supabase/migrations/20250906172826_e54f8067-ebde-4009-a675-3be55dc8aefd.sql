-- Recreate database functions with proper security settings to resolve security scan warnings
-- This maintains all existing functionality while adding security hardening

-- Recreate is_store_owner function with explicit search path
CREATE OR REPLACE FUNCTION public.is_store_owner(store_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.stores 
    WHERE id = store_uuid AND owner_id = auth.uid()
  );
END;
$function$;

-- Recreate is_super_admin function with explicit search path
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$function$;

-- Recreate handle_new_user function with explicit search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  selected_plan_text text;
  selected_plan_enum public.plan_limits.plan_name%type;
  plan_days integer;
begin
  -- Read selected plan from user metadata; fallback to 'starter'
  selected_plan_text := coalesce(nullif(new.raw_user_meta_data->>'selected_plan', ''), 'starter');

  -- Prefer a plan that exists in plan_limits; fallback to 'starter'
  select pl.plan_name, pl.trial_days
  into selected_plan_enum, plan_days
  from public.plan_limits pl
  where pl.plan_name::text = selected_plan_text
  limit 1;

  if selected_plan_enum is null then
    select pl.plan_name, pl.trial_days
    into selected_plan_enum, plan_days
    from public.plan_limits pl
    where pl.plan_name::text = 'starter'
    limit 1;
  end if;

  plan_days := coalesce(plan_days, 7);

  insert into public.profiles (
    id, email, full_name, phone,
    subscription_plan, account_status,
    trial_started_at, trial_expires_at, created_at, updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone',
    selected_plan_enum,
    'trial',
    now(),
    now() + make_interval(days => plan_days),
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;

-- Recreate validate_training_lesson function with explicit search path
CREATE OR REPLACE FUNCTION public.validate_training_lesson()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.content_type = 'video' AND
     COALESCE(NULLIF(trim(NEW.video_url), ''), NULL) IS NULL AND
     COALESCE(NULLIF(trim(NEW.embed_code), ''), NULL) IS NULL THEN
    RAISE EXCEPTION 'Video lessons require video_url or embed_code';
  ELSIF NEW.content_type = 'text' AND
        COALESCE(NULLIF(trim(NEW.text_content), ''), NULL) IS NULL THEN
    RAISE EXCEPTION 'Text lessons require text_content';
  ELSIF NEW.content_type = 'pdf' AND
        COALESCE(NULLIF(trim(NEW.pdf_url), ''), NULL) IS NULL THEN
    RAISE EXCEPTION 'PDF lessons require pdf_url';
  ELSIF NEW.content_type = 'embed' AND
        COALESCE(NULLIF(trim(NEW.embed_code), ''), NULL) IS NULL THEN
    RAISE EXCEPTION 'Embed lessons require embed_code';
  ELSIF NEW.content_type = 'link' AND
        COALESCE(NULLIF(trim(NEW.link_url), ''), NULL) IS NULL THEN
    RAISE EXCEPTION 'Link lessons require link_url';
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate update_updated_at_column function with explicit search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;