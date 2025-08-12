-- Harden RLS and privileges on public.form_submissions without breaking public form submission
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions FORCE ROW LEVEL SECURITY;

-- Keep existing policies; ensure minimal public INSERT and owner management policies exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='form_submissions' AND policyname='Anyone can submit forms to active stores'
  ) THEN
    CREATE POLICY "Anyone can submit forms to active stores"
    ON public.form_submissions
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.stores s
        WHERE s.id = form_submissions.store_id AND s.is_active = true
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='form_submissions' AND policyname='Store owners can manage form submissions'
  ) THEN
    CREATE POLICY "Store owners can manage form submissions"
    ON public.form_submissions
    FOR ALL
    USING (public.is_store_owner(store_id));
  END IF;
END $$;

-- Tighten role privileges: allow anon only INSERT; authenticated can manage (subject to RLS)
REVOKE ALL ON public.form_submissions FROM anon;
GRANT INSERT ON public.form_submissions TO anon;
GRANT SELECT, UPDATE, DELETE, INSERT ON public.form_submissions TO authenticated;