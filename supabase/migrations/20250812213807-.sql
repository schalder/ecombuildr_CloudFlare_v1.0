-- Harden RLS on public.orders to protect sensitive PII and payment data
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;

-- Remove permissive public policy if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'orders' 
      AND policyname = 'Anyone can view orders'
  ) THEN
    DROP POLICY "Anyone can view orders" ON public.orders;
  END IF;
END $$;

-- Create explicit least-privilege policies for store owners
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Store owners can select orders'
  ) THEN
    CREATE POLICY "Store owners can select orders"
    ON public.orders
    FOR SELECT
    USING (public.is_store_owner(store_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Store owners can insert orders'
  ) THEN
    CREATE POLICY "Store owners can insert orders"
    ON public.orders
    FOR INSERT
    WITH CHECK (public.is_store_owner(store_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Store owners can update orders'
  ) THEN
    CREATE POLICY "Store owners can update orders"
    ON public.orders
    FOR UPDATE
    USING (public.is_store_owner(store_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Store owners can delete orders'
  ) THEN
    CREATE POLICY "Store owners can delete orders"
    ON public.orders
    FOR DELETE
    USING (public.is_store_owner(store_id));
  END IF;
END $$;

-- Ensure anon cannot access; authenticated may, subject to RLS
REVOKE ALL ON public.orders FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;