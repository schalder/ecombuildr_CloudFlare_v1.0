
-- 1) Per-store shipping credentials (owner-only)
CREATE TABLE IF NOT EXISTS public.store_shipping_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('steadfast')),
  api_key text NOT NULL,
  secret_key text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_shipping_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_shipping_accounts FORCE ROW LEVEL SECURITY;

-- RLS: store owners only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='store_shipping_accounts' AND policyname='Store owners can view shipping accounts'
  ) THEN
    CREATE POLICY "Store owners can view shipping accounts"
    ON public.store_shipping_accounts
    FOR SELECT
    USING (public.is_store_owner(store_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='store_shipping_accounts' AND policyname='Store owners can insert shipping accounts'
  ) THEN
    CREATE POLICY "Store owners can insert shipping accounts"
    ON public.store_shipping_accounts
    FOR INSERT
    WITH CHECK (public.is_store_owner(store_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='store_shipping_accounts' AND policyname='Store owners can update shipping accounts'
  ) THEN
    CREATE POLICY "Store owners can update shipping accounts"
    ON public.store_shipping_accounts
    FOR UPDATE
    USING (public.is_store_owner(store_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='store_shipping_accounts' AND policyname='Store owners can delete shipping accounts'
  ) THEN
    CREATE POLICY "Store owners can delete shipping accounts"
    ON public.store_shipping_accounts
    FOR DELETE
    USING (public.is_store_owner(store_id));
  END IF;
END $$;

REVOKE ALL ON public.store_shipping_accounts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_shipping_accounts TO authenticated;

-- keep updated_at fresh
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_store_shipping_accounts_updated_at'
  ) THEN
    CREATE TRIGGER trg_store_shipping_accounts_updated_at
    BEFORE UPDATE ON public.store_shipping_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 2) Courier shipments mapping for orders
CREATE TABLE IF NOT EXISTS public.courier_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('steadfast')),
  invoice text,
  consignment_id text,
  tracking_code text,
  status text,
  request_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_payload jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courier_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_shipments FORCE ROW LEVEL SECURITY;

-- RLS: store owners only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='courier_shipments' AND policyname='Store owners can view shipments'
  ) THEN
    CREATE POLICY "Store owners can view shipments"
    ON public.courier_shipments
    FOR SELECT
    USING (public.is_store_owner(store_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='courier_shipments' AND policyname='Store owners can insert shipments'
  ) THEN
    CREATE POLICY "Store owners can insert shipments"
    ON public.courier_shipments
    FOR INSERT
    WITH CHECK (public.is_store_owner(store_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='courier_shipments' AND policyname='Store owners can update shipments'
  ) THEN
    CREATE POLICY "Store owners can update shipments"
    ON public.courier_shipments
    FOR UPDATE
    USING (public.is_store_owner(store_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='courier_shipments' AND policyname='Store owners can delete shipments'
  ) THEN
    CREATE POLICY "Store owners can delete shipments"
    ON public.courier_shipments
    FOR DELETE
    USING (public.is_store_owner(store_id));
  END IF;
END $$;

REVOKE ALL ON public.courier_shipments FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courier_shipments TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_courier_shipments_updated_at'
  ) THEN
    CREATE TRIGGER trg_courier_shipments_updated_at
    BEFORE UPDATE ON public.courier_shipments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) Return requests tracking
CREATE TABLE IF NOT EXISTS public.courier_return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  order_id uuid NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  provider text NOT NULL CHECK (provider IN ('steadfast')),
  provider_return_id text,
  consignment_id text,
  invoice text,
  tracking_code text,
  reason text,
  status text,
  response_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courier_return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_return_requests FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='courier_return_requests' AND policyname='Store owners can view return requests'
  ) THEN
    CREATE POLICY "Store owners can view return requests"
    ON public.courier_return_requests
    FOR SELECT
    USING (public.is_store_owner(store_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='courier_return_requests' AND policyname='Store owners can insert return requests'
  ) THEN
    CREATE POLICY "Store owners can insert return requests"
    ON public.courier_return_requests
    FOR INSERT
    WITH CHECK (public.is_store_owner(store_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='courier_return_requests' AND policyname='Store owners can update return requests'
  ) THEN
    CREATE POLICY "Store owners can update return requests"
    ON public.courier_return_requests
    FOR UPDATE
    USING (public.is_store_owner(store_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='courier_return_requests' AND policyname='Store owners can delete return requests'
  ) THEN
    CREATE POLICY "Store owners can delete return requests"
    ON public.courier_return_requests
    FOR DELETE
    USING (public.is_store_owner(store_id));
  END IF;
END $$;

REVOKE ALL ON public.courier_return_requests FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courier_return_requests TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_courier_return_requests_updated_at'
  ) THEN
    CREATE TRIGGER trg_courier_return_requests_updated_at
    BEFORE UPDATE ON public.courier_return_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
