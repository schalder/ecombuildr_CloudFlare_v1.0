-- Enable RLS on blocked_ips table for security
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips FORCE ROW LEVEL SECURITY;

-- Revoke public access
REVOKE ALL ON public.blocked_ips FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_ips TO authenticated;

-- RLS Policies: Store owners can manage their own blocked IPs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blocked_ips' AND policyname = 'Store owners can select blocked IPs'
  ) THEN
    CREATE POLICY "Store owners can select blocked IPs"
    ON public.blocked_ips
    FOR SELECT
    USING (public.is_store_owner(store_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blocked_ips' AND policyname = 'Store owners can insert blocked IPs'
  ) THEN
    CREATE POLICY "Store owners can insert blocked IPs"
    ON public.blocked_ips
    FOR INSERT
    WITH CHECK (public.is_store_owner(store_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blocked_ips' AND policyname = 'Store owners can update blocked IPs'
  ) THEN
    CREATE POLICY "Store owners can update blocked IPs"
    ON public.blocked_ips
    FOR UPDATE
    USING (public.is_store_owner(store_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'blocked_ips' AND policyname = 'Store owners can delete blocked IPs'
  ) THEN
    CREATE POLICY "Store owners can delete blocked IPs"
    ON public.blocked_ips
    FOR DELETE
    USING (public.is_store_owner(store_id));
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE public.blocked_ips IS 'Blocked IP addresses per store to prevent fake orders. RLS enabled - only store owners can access their own blocked IPs.';

