-- Ensure FORCE ROW LEVEL SECURITY is NOT enabled (it blocks all access)
-- pixel_events doesn't have FORCE RLS, so incomplete_checkouts shouldn't either
ALTER TABLE public.incomplete_checkouts NO FORCE ROW LEVEL SECURITY;

-- Double-check RLS is enabled (but not forced)
ALTER TABLE public.incomplete_checkouts ENABLE ROW LEVEL SECURITY;

-- Verify the INSERT policy exists and is correct
DROP POLICY IF EXISTS "Anyone can insert incomplete checkouts" ON public.incomplete_checkouts;

CREATE POLICY "Anyone can insert incomplete checkouts"
  ON public.incomplete_checkouts
  FOR INSERT
  WITH CHECK (true);

-- Ensure permissions are granted
GRANT INSERT ON public.incomplete_checkouts TO anon;
GRANT INSERT ON public.incomplete_checkouts TO authenticated;
