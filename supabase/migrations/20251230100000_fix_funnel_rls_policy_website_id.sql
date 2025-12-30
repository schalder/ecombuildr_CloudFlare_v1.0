-- Fix RLS policy for funnels to properly validate website_id on UPDATE
-- The issue: The USING clause was validating the OLD website_id, which blocked updates
-- when the old website_id was invalid or didn't exist.
-- 
-- Solution:
-- - USING: Only check if user owns the funnel (via store_id), don't validate old website_id
-- - WITH CHECK: Validate the NEW website_id (must be NULL or a website the user owns)

DROP POLICY IF EXISTS "Store owners can manage funnels" ON public.funnels;

CREATE POLICY "Store owners can manage funnels" 
ON public.funnels 
FOR ALL 
USING (
  -- For USING: Only check if user owns the funnel (don't validate old website_id)
  -- This allows updating even if the old website_id is invalid
  is_store_owner(store_id)
)
WITH CHECK (
  -- For WITH CHECK: Validate the NEW website_id (must be NULL or a website the user owns)
  is_store_owner(store_id) AND 
  (website_id IS NULL OR EXISTS (
    SELECT 1 FROM public.websites w 
    WHERE w.id = funnels.website_id 
    AND is_store_owner(w.store_id)
  ))
);

