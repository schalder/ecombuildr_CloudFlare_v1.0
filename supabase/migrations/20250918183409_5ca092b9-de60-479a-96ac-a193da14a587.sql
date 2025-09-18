-- Fix the function search path warnings by setting explicit search_path on our public wrapper functions
CREATE OR REPLACE FUNCTION public.gen_salt(alg text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
  SELECT extensions.gen_salt(alg);
$$;

CREATE OR REPLACE FUNCTION public.gen_salt(alg text, rounds integer)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
  SELECT extensions.gen_salt(alg, rounds);
$$;

CREATE OR REPLACE FUNCTION public.crypt(pw text, salt text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
  SELECT extensions.crypt(pw, salt);
$$;