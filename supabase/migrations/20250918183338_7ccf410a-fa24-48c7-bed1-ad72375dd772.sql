-- Ensure pgcrypto is available under the extensions schema and provide public wrappers
DO $$
BEGIN
  -- Create extensions schema if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_namespace WHERE nspname = 'extensions'
  ) THEN
    CREATE SCHEMA extensions;
  END IF;

  -- Install pgcrypto if missing, placing it in the extensions schema
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
  ) THEN
    CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
  END IF;

  -- If pgcrypto exists but not in the extensions schema, move it
  IF EXISTS (
    SELECT 1 
    FROM pg_extension e 
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pgcrypto' AND n.nspname <> 'extensions'
  ) THEN
    ALTER EXTENSION pgcrypto SET SCHEMA extensions;
  END IF;
END $$;

-- Create safe, minimal wrapper functions in public so legacy calls like public.gen_salt(...) work
CREATE OR REPLACE FUNCTION public.gen_salt(alg text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT extensions.gen_salt(alg);
$$;

-- Overload supporting cost/rounds when provided (e.g., gen_salt('bf', 12))
CREATE OR REPLACE FUNCTION public.gen_salt(alg text, rounds integer)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT extensions.gen_salt(alg, rounds);
$$;

-- Wrapper for crypt(password, salt)
CREATE OR REPLACE FUNCTION public.crypt(pw text, salt text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT extensions.crypt(pw, salt);
$$;