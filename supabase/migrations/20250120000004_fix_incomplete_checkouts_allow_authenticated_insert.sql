-- Also grant INSERT to authenticated role (in case user is logged in)
-- The RLS policy will still enforce the store check
GRANT INSERT ON public.incomplete_checkouts TO authenticated;

-- Verify the policy works for both anon and authenticated
-- The policy already applies to 'public' role which includes both
-- But let's make sure it's explicitly set
DO $$ 
BEGIN
  -- Recreate the policy to ensure it's explicit
  DROP POLICY IF EXISTS "Anyone can insert incomplete checkouts" ON public.incomplete_checkouts;
  
  CREATE POLICY "Anyone can insert incomplete checkouts"
    ON public.incomplete_checkouts
    FOR INSERT
    TO public  -- This includes both anon and authenticated roles
    WITH CHECK (
      -- Verify the store exists and is active (security check)
      EXISTS (
        SELECT 1 FROM public.stores 
        WHERE id = incomplete_checkouts.store_id 
        AND is_active = true
      )
    );
END $$;
