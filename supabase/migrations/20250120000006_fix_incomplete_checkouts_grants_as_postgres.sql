-- The issue: ACL shows anon=a/postgres but 401 suggests permission denied
-- Let's grant permissions explicitly as postgres (table owner)
-- This ensures permissions are set correctly

-- Grant INSERT permission explicitly (as postgres owner)
GRANT INSERT ON public.incomplete_checkouts TO anon;
GRANT INSERT ON public.incomplete_checkouts TO authenticated;

-- Verify the policy exists and is simple
DROP POLICY IF EXISTS "Anyone can insert incomplete checkouts" ON public.incomplete_checkouts;

CREATE POLICY "Anyone can insert incomplete checkouts"
  ON public.incomplete_checkouts
  FOR INSERT
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.incomplete_checkouts ENABLE ROW LEVEL SECURITY;
