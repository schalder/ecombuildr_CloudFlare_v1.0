-- Enforce strict RLS and privileges on customer_addresses to protect PII
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses FORCE ROW LEVEL SECURITY;

-- Optional cleanup of any permissive public policy (idempotent safe)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='customer_addresses' AND policyname='Anyone can view customer addresses'
  ) THEN
    DROP POLICY "Anyone can view customer addresses" ON public.customer_addresses;
  END IF;
END $$;

-- Ensure an explicit INSERT policy with WITH CHECK for store owners (existing manage policies may lack WITH CHECK)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='customer_addresses' AND policyname='Store owners can insert customer addresses'
  ) THEN
    CREATE POLICY "Store owners can insert customer addresses"
    ON public.customer_addresses
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = customer_addresses.customer_id AND public.is_store_owner(c.store_id)
      )
    );
  END IF;
END $$;

-- Ensure explicit SELECT/UPDATE/DELETE policies exist (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='customer_addresses' AND policyname='Store owners can select customer addresses'
  ) THEN
    CREATE POLICY "Store owners can select customer addresses"
    ON public.customer_addresses
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = customer_addresses.customer_id AND public.is_store_owner(c.store_id)
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='customer_addresses' AND policyname='Store owners can update customer addresses'
  ) THEN
    CREATE POLICY "Store owners can update customer addresses"
    ON public.customer_addresses
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = customer_addresses.customer_id AND public.is_store_owner(c.store_id)
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='customer_addresses' AND policyname='Store owners can delete customer addresses'
  ) THEN
    CREATE POLICY "Store owners can delete customer addresses"
    ON public.customer_addresses
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = customer_addresses.customer_id AND public.is_store_owner(c.store_id)
      )
    );
  END IF;
END $$;

-- Tighten privileges: anon none; authenticated subject to RLS
REVOKE ALL ON public.customer_addresses FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;