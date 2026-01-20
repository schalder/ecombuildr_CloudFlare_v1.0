-- Remove all anonymous INSERT policies - frontend will use Edge Function instead
-- This restores proper security: only service role can write to the table

-- Drop all INSERT policies that allow anonymous access
DROP POLICY IF EXISTS "Anyone can insert incomplete checkouts" ON public.incomplete_checkouts;
DROP POLICY IF EXISTS "Anon can insert incomplete checkouts" ON public.incomplete_checkouts;
DROP POLICY IF EXISTS "Authenticated can insert incomplete checkouts" ON public.incomplete_checkouts;
DROP POLICY IF EXISTS "Store owners can insert their incomplete checkouts" ON public.incomplete_checkouts;

-- Revoke INSERT permission from anon and authenticated
-- Only service role should be able to insert (via Edge Function)
REVOKE INSERT ON public.incomplete_checkouts FROM anon;
REVOKE INSERT ON public.incomplete_checkouts FROM authenticated;

-- Keep RLS enabled (security requirement)
ALTER TABLE public.incomplete_checkouts ENABLE ROW LEVEL SECURITY;
