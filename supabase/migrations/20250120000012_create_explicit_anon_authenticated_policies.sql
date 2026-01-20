-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can insert incomplete checkouts" ON public.incomplete_checkouts;

-- Create explicit policies for anon and authenticated roles
-- This ensures they're definitely applied
CREATE POLICY "Anon can insert incomplete checkouts"
  ON public.incomplete_checkouts
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert incomplete checkouts"
  ON public.incomplete_checkouts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
