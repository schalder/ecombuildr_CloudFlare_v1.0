-- Fix website and funnel slug uniqueness to be global across the platform
-- This prevents URL conflicts when different users create websites/funnels with the same name

-- Step 1: Drop the current store-scoped unique constraints
ALTER TABLE public.websites DROP CONSTRAINT IF EXISTS websites_store_id_slug_key;
ALTER TABLE public.funnels DROP CONSTRAINT IF EXISTS funnels_store_id_slug_key;

-- Step 2: Add global unique constraints on slug only
-- This ensures every website has a globally unique slug across all stores
ALTER TABLE public.websites ADD CONSTRAINT websites_slug_key UNIQUE (slug);

-- This ensures every funnel has a globally unique slug across all stores
ALTER TABLE public.funnels ADD CONSTRAINT funnels_slug_key UNIQUE (slug);

-- Step 3: Add indexes for performance on store_id lookups
CREATE INDEX IF NOT EXISTS idx_websites_store_id ON public.websites(store_id);
CREATE INDEX IF NOT EXISTS idx_funnels_store_id ON public.funnels(store_id);

-- Note: The CreateWebsite and CreateFunnel components already check for global slug availability
-- and append random characters if conflicts are detected, so this constraint will work seamlessly