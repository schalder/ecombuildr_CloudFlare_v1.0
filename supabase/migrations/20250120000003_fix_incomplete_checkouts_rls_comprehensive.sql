-- Comprehensive fix for incomplete_checkouts RLS to ensure anonymous inserts work
-- Following the same pattern as form_submissions and newsletter_subscribers

-- First, ensure we revoke all permissions (in case of any defaults)
REVOKE ALL ON public.incomplete_checkouts FROM anon;

-- Then grant only INSERT permission to anon role
GRANT INSERT ON public.incomplete_checkouts TO anon;

-- Verify the INSERT policy exists and is correct
-- (It should already exist from the previous migration, but let's ensure it's correct)
DO $$ 
BEGIN
  -- Drop and recreate the policy to ensure it's correct
  DROP POLICY IF EXISTS "Anyone can insert incomplete checkouts" ON public.incomplete_checkouts;
  
  CREATE POLICY "Anyone can insert incomplete checkouts"
    ON public.incomplete_checkouts
    FOR INSERT
    TO public  -- Apply to all roles (anon, authenticated, etc.)
    WITH CHECK (
      -- Verify the store exists and is active (security check)
      EXISTS (
        SELECT 1 FROM public.stores 
        WHERE id = incomplete_checkouts.store_id 
        AND is_active = true
      )
    );
END $$;
