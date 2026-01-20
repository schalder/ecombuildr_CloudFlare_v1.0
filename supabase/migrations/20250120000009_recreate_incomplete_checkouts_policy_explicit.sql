-- Recreate the policy with explicit TO clause to ensure it applies correctly
DROP POLICY IF EXISTS "Anyone can insert incomplete checkouts" ON public.incomplete_checkouts;

-- Create policy explicitly for anon and authenticated roles
CREATE POLICY "Anyone can insert incomplete checkouts"
  ON public.incomplete_checkouts
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Also try creating separate policies for anon and authenticated to be absolutely sure
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
