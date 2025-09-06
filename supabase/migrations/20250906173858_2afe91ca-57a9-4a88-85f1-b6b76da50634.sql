
-- Harden normalize_phone with explicit search_path (no behavior change)
CREATE OR REPLACE FUNCTION public.normalize_phone(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select case
    when p is null then null
    else regexp_replace(p, '[^0-9+]', '', 'g')
  end
$function$;
