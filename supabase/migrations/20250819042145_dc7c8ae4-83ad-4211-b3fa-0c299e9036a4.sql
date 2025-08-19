
-- 1) Enum for product library status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_library_status') THEN
    CREATE TYPE public.product_library_status AS ENUM ('draft','published','archived');
  END IF;
END$$;

-- 2) Product Library: add publishing and pricing fields, category relation
ALTER TABLE public.product_library
  ADD COLUMN IF NOT EXISTS status public.product_library_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS base_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS published_at timestamptz NULL;

-- 3) Create Library Categories
CREATE TABLE IF NOT EXISTS public.product_library_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Relate library items to library categories
ALTER TABLE public.product_library
  ADD COLUMN IF NOT EXISTS category_id uuid NULL REFERENCES public.product_library_categories(id) ON DELETE SET NULL;

-- 5) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_product_library_status_created ON public.product_library (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_library_category_id ON public.product_library (category_id);

-- 6) Updated_at trigger on library categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'product_library_categories_set_updated_at'
  ) THEN
    CREATE TRIGGER product_library_categories_set_updated_at
    BEFORE UPDATE ON public.product_library_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- 7) Tighten library SELECT visibility for users: only published items
-- Drop older broad SELECT policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'product_library' 
      AND policyname = 'Store owners can view product library'
  ) THEN
    DROP POLICY "Store owners can view product library" ON public.product_library;
  END IF;
END$$;

-- Policy: Authenticated users can view only published items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'product_library' 
      AND policyname = 'Authenticated users can view published library items'
  ) THEN
    CREATE POLICY "Authenticated users can view published library items"
      ON public.product_library
      FOR SELECT
      TO authenticated
      USING (status = 'published');
  END IF;
END$$;

-- Keep super admin manage policy as-is; ensure it exists (idempotent create)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_library'
      AND policyname = 'Super admin can manage product library'
  ) THEN
    CREATE POLICY "Super admin can manage product library"
      ON public.product_library
      FOR ALL
      TO authenticated
      USING (public.is_super_admin())
      WITH CHECK (public.is_super_admin());
  END IF;
END$$;

-- 8) Library categories RLS
ALTER TABLE public.product_library_categories ENABLE ROW LEVEL SECURITY;

-- Users can view active categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='product_library_categories'
      AND policyname='Anyone can view active library categories'
  ) THEN
    CREATE POLICY "Anyone can view active library categories"
      ON public.product_library_categories
      FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;
END$$;

-- Super admin can manage categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='product_library_categories'
      AND policyname='Super admin can manage library categories'
  ) THEN
    CREATE POLICY "Super admin can manage library categories"
      ON public.product_library_categories
      FOR ALL
      TO authenticated
      USING (public.is_super_admin())
      WITH CHECK (public.is_super_admin());
  END IF;
END$$;

-- 9) Track imports from library -> store products
CREATE TABLE IF NOT EXISTS public.product_library_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_item_id uuid NOT NULL REFERENCES public.product_library(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid NULL REFERENCES public.products(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'imported',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_library_imports ENABLE ROW LEVEL SECURITY;

-- Store owners can manage their own import records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='product_library_imports'
      AND policyname='Store owners can manage own imports'
  ) THEN
    CREATE POLICY "Store owners can manage own imports"
      ON public.product_library_imports
      FOR ALL
      TO authenticated
      USING (public.is_store_owner(store_id))
      WITH CHECK (public.is_store_owner(store_id));
  END IF;
END$$;

-- Super admin can view all imports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='product_library_imports'
      AND policyname='Super admin can view all imports'
  ) THEN
    CREATE POLICY "Super admin can view all imports"
      ON public.product_library_imports
      FOR SELECT
      TO authenticated
      USING (public.is_super_admin());
  END IF;
END$$;

-- updated_at trigger for imports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'product_library_imports_set_updated_at'
  ) THEN
    CREATE TRIGGER product_library_imports_set_updated_at
    BEFORE UPDATE ON public.product_library_imports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- 10) Mark products originating from the library and fulfillment type
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS library_item_id uuid NULL REFERENCES public.product_library(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fulfillment_type text NOT NULL DEFAULT 'store_owner',
  ADD COLUMN IF NOT EXISTS cost_price numeric NULL,
  ADD COLUMN IF NOT EXISTS supplier_link text NULL;

CREATE INDEX IF NOT EXISTS idx_products_library_item_id ON public.products (library_item_id);

-- 11) Allow super admin to manage orders and shipping artifacts for admin fulfillment
-- (Adds policies without removing existing store-owner ones)
-- Orders: super admin manage
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='orders'
      AND policyname='Super admin can manage orders'
  ) THEN
    CREATE POLICY "Super admin can manage orders"
      ON public.orders
      FOR ALL
      TO authenticated
      USING (public.is_super_admin())
      WITH CHECK (public.is_super_admin());
  END IF;
END$$;

-- Shipment events: super admin manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='courier_shipment_events'
      AND policyname='Super admin can manage shipment events'
  ) THEN
    CREATE POLICY "Super admin can manage shipment events"
      ON public.courier_shipment_events
      FOR ALL
      TO authenticated
      USING (public.is_super_admin())
      WITH CHECK (public.is_super_admin());
  END IF;
END$$;

-- Return requests: super admin manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='courier_return_requests'
      AND policyname='Super admin can manage return requests'
  ) THEN
    CREATE POLICY "Super admin can manage return requests"
      ON public.courier_return_requests
      FOR ALL
      TO authenticated
      USING (public.is_super_admin())
      WITH CHECK (public.is_super_admin());
  END IF;
END$$;
