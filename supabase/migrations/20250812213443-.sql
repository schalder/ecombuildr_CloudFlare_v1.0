-- Harden RLS on public.customers to protect PII
-- 1) Ensure RLS is enabled and enforced
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers FORCE ROW LEVEL SECURITY;

-- 2) Remove any overly permissive public policy if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'customers' 
      AND policyname = 'Anyone can view customers'
  ) THEN
    DROP POLICY "Anyone can view customers" ON public.customers;
  END IF;
END $$;

-- 3) Create least-privilege policies for store owners (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'Store owners can select customers'
  ) THEN
    CREATE POLICY "Store owners can select customers"
    ON public.customers
    FOR SELECT
    USING (public.is_store_owner(store_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'Store owners can insert customers'
  ) THEN
    CREATE POLICY "Store owners can insert customers"
    ON public.customers
    FOR INSERT
    WITH CHECK (public.is_store_owner(store_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'Store owners can update customers'
  ) THEN
    CREATE POLICY "Store owners can update customers"
    ON public.customers
    FOR UPDATE
    USING (public.is_store_owner(store_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'Store owners can delete customers'
  ) THEN
    CREATE POLICY "Store owners can delete customers"
    ON public.customers
    FOR DELETE
    USING (public.is_store_owner(store_id));
  END IF;
END $$;

-- 4) Ensure only authenticated users can access the table (RLS still applies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
REVOKE ALL ON public.customers FROM anon;