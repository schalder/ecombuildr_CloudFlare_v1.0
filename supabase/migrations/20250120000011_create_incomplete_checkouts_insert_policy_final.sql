-- The policy is missing! Let's create it properly
-- First, ensure RLS is enabled
ALTER TABLE public.incomplete_checkouts ENABLE ROW LEVEL SECURITY;

-- Drop any existing INSERT policies (in case they exist but aren't showing)
DROP POLICY IF EXISTS "Anyone can insert incomplete checkouts" ON public.incomplete_checkouts;
DROP POLICY IF EXISTS "Anon can insert incomplete checkouts" ON public.incomplete_checkouts;
DROP POLICY IF EXISTS "Authenticated can insert incomplete checkouts" ON public.incomplete_checkouts;
DROP POLICY IF EXISTS "Store owners can insert their incomplete checkouts" ON public.incomplete_checkouts;

-- Create the INSERT policy - using the exact same syntax as pixel_events
CREATE POLICY "Anyone can insert incomplete checkouts" 
ON public.incomplete_checkouts 
FOR INSERT 
WITH CHECK (true);
