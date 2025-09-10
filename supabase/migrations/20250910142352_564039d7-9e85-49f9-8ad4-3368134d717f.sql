-- Fix domain connections constraints to allow multiple content types per domain
-- Drop the problematic unique index that prevents funnel connections to domains with websites
DROP INDEX IF EXISTS public.idx_unique_path_per_domain;

-- Ensure we have the correct unique constraint for homepage management
-- Drop any duplicate homepage indexes first
DROP INDEX IF EXISTS public.idx_unique_homepage_per_domain_duplicate;
DROP INDEX IF EXISTS public.idx_domain_connections_homepage;

-- Create the proper unique index for homepage enforcement (only one homepage per domain)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_homepage_per_domain 
ON public.domain_connections (domain_id) 
WHERE is_homepage = true;

-- Add unique constraint to prevent exact duplicate connections (same domain, content_type, content_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_domain_connections_unique_target
ON public.domain_connections (domain_id, content_type, content_id);

-- Add performance index for routing lookups
CREATE INDEX IF NOT EXISTS idx_domain_connections_lookup
ON public.domain_connections (domain_id, path, is_homepage);