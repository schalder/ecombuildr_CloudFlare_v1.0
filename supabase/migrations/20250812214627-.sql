-- Harden RLS and privileges on public.newsletter_subscribers without breaking public subscribe
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers FORCE ROW LEVEL SECURITY;

-- Ensure policies exist (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='newsletter_subscribers' AND policyname='Anyone can subscribe to active store newsletters'
  ) THEN
    CREATE POLICY "Anyone can subscribe to active store newsletters"
    ON public.newsletter_subscribers
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.stores s
        WHERE s.id = newsletter_subscribers.store_id AND s.is_active = true
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='newsletter_subscribers' AND policyname='Store owners can manage newsletter subscribers'
  ) THEN
    CREATE POLICY "Store owners can manage newsletter subscribers"
    ON public.newsletter_subscribers
    FOR ALL
    USING (public.is_store_owner(store_id));
  END IF;
END $$;

-- Tighten privileges: anon can only INSERT; authenticated can manage (RLS enforced)
REVOKE ALL ON public.newsletter_subscribers FROM anon;
GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;