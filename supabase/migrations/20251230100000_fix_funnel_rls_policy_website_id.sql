-- Fix RLS policy for funnels to properly validate website_id on UPDATE
-- The issue: The policy only had USING clause, which checks the OLD row value
-- For UPDATE operations, we need WITH CHECK to validate the NEW row value
-- This was preventing website_id from being updated when the old value was invalid

DROP POLICY IF EXISTS "Store owners can manage funnels" ON public.funnels;

CREATE POLICY "Store owners can manage funnels" 
ON public.funnels 
FOR ALL 
USING (
  is_store_owner(store_id) AND 
  (website_id IS NULL OR EXISTS (
    SELECT 1 FROM public.websites w 
    WHERE w.id = funnels.website_id 
    AND is_store_owner(w.store_id)
  ))
)
WITH CHECK (
  is_store_owner(store_id) AND 
  (website_id IS NULL OR EXISTS (
    SELECT 1 FROM public.websites w 
    WHERE w.id = funnels.website_id 
    AND is_store_owner(w.store_id)
  ))
);

