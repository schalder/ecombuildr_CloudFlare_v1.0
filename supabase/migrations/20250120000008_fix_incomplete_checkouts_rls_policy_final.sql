-- The issue: RLS policy is blocking inserts even though WITH CHECK (true)
-- This might be because there are multiple policies or the policy isn't being evaluated correctly
-- Let's drop ALL INSERT policies and create a single, simple one

-- Drop ALL existing INSERT policies
DROP POLICY IF EXISTS "Store owners can insert their incomplete checkouts" ON public.incomplete_checkouts;
DROP POLICY IF EXISTS "Anyone can insert incomplete checkouts" ON public.incomplete_checkouts;

-- Create a single, simple INSERT policy exactly like pixel_events
CREATE POLICY "Anyone can insert incomplete checkouts"
  ON public.incomplete_checkouts
  FOR INSERT
  WITH CHECK (true);

-- Verify RLS is enabled but not forced
ALTER TABLE public.incomplete_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomplete_checkouts NO FORCE ROW LEVEL SECURITY;

-- Ensure permissions are correct
GRANT INSERT ON public.incomplete_checkouts TO anon;
GRANT INSERT ON public.incomplete_checkouts TO authenticated;
