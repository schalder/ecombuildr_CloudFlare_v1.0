-- Fix RLS policies for incomplete_checkouts to allow anonymous inserts
-- Similar to pixel_events table which allows anonymous tracking

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Store owners can insert their incomplete checkouts" ON public.incomplete_checkouts;

-- Create a new policy that allows anyone to insert incomplete checkouts
-- This is needed because customers (anonymous users) fill out checkout forms
CREATE POLICY "Anyone can insert incomplete checkouts"
  ON public.incomplete_checkouts
  FOR INSERT
  WITH CHECK (
    -- Verify the store exists and is active (security check)
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id = incomplete_checkouts.store_id 
      AND is_active = true
    )
  );

-- Grant INSERT permission to anon role (anonymous users)
GRANT INSERT ON public.incomplete_checkouts TO anon;

-- Keep SELECT, UPDATE, DELETE restricted to store owners (already exists)
-- These policies remain unchanged:
-- - "Store owners can view their incomplete checkouts" (SELECT)
-- - "Store owners can update their incomplete checkouts" (UPDATE)  
-- - "Store owners can delete their incomplete checkouts" (DELETE)
