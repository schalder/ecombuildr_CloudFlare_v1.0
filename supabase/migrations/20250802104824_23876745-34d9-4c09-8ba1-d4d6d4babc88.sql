-- Fix store_customizations table constraint issues
-- Drop the problematic constraint and recreate with proper logic
ALTER TABLE public.store_customizations DROP CONSTRAINT IF EXISTS store_customizations_store_id_key;

-- Create a proper unique index that allows multiple inactive customizations per store
-- but only one active customization per store
CREATE UNIQUE INDEX store_customizations_active_unique 
ON public.store_customizations (store_id) 
WHERE is_active = true;

-- Add an index for performance on store_id lookups
CREATE INDEX IF NOT EXISTS idx_store_customizations_store_id 
ON public.store_customizations (store_id);

-- Add an index for theme template lookups
CREATE INDEX IF NOT EXISTS idx_store_customizations_theme_template 
ON public.store_customizations (theme_template_id);

-- Update RLS policy to be more specific
DROP POLICY IF EXISTS "Store owners can manage their customizations" ON public.store_customizations;

CREATE POLICY "Store owners can view their customizations" 
ON public.store_customizations 
FOR SELECT 
USING (is_store_owner(store_id));

CREATE POLICY "Store owners can insert their customizations" 
ON public.store_customizations 
FOR INSERT 
WITH CHECK (is_store_owner(store_id));

CREATE POLICY "Store owners can update their customizations" 
ON public.store_customizations 
FOR UPDATE 
USING (is_store_owner(store_id));

CREATE POLICY "Store owners can delete their customizations" 
ON public.store_customizations 
FOR DELETE 
USING (is_store_owner(store_id));