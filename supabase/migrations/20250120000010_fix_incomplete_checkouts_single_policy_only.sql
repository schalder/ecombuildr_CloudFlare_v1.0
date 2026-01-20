-- Drop ALL INSERT policies - having multiple might be causing conflicts
DROP POLICY IF EXISTS "Anyone can insert incomplete checkouts" ON public.incomplete_checkouts;
DROP POLICY IF EXISTS "Anon can insert incomplete checkouts" ON public.incomplete_checkouts;
DROP POLICY IF EXISTS "Authenticated can insert incomplete checkouts" ON public.incomplete_checkouts;
DROP POLICY IF EXISTS "Store owners can insert their incomplete checkouts" ON public.incomplete_checkouts;

-- Create ONLY ONE policy with TO public (covers both anon and authenticated)
CREATE POLICY "Anyone can insert incomplete checkouts"
  ON public.incomplete_checkouts
  FOR INSERT
  TO public
  WITH CHECK (true);
