-- Simplify the INSERT policy to match pixel_events exactly
-- pixel_events uses WITH CHECK (true) - no conditions
-- We'll add the store check back later if needed, but first let's get it working

DO $$ 
BEGIN
  -- Drop the existing policy
  DROP POLICY IF EXISTS "Anyone can insert incomplete checkouts" ON public.incomplete_checkouts;
  
  -- Create a simple policy like pixel_events (no conditions)
  CREATE POLICY "Anyone can insert incomplete checkouts"
    ON public.incomplete_checkouts
    FOR INSERT
    WITH CHECK (true);  -- No conditions, just like pixel_events
END $$;

-- Ensure permissions are correct
REVOKE ALL ON public.incomplete_checkouts FROM anon;
GRANT INSERT ON public.incomplete_checkouts TO anon;
GRANT INSERT ON public.incomplete_checkouts TO authenticated;
