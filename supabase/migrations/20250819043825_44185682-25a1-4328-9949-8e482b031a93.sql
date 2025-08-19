-- Create the product_library_imports table to track when products are imported from library to stores
CREATE TABLE IF NOT EXISTS public.product_library_imports (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    library_item_id uuid NOT NULL REFERENCES public.product_library(id) ON DELETE CASCADE,
    store_id uuid NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'imported',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    
    -- Ensure a library item can only be imported once per store
    UNIQUE(library_item_id, store_id)
);

-- Enable RLS on product_library_imports
ALTER TABLE public.product_library_imports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_library_imports
CREATE POLICY "Store owners can manage own imports" ON public.product_library_imports
    FOR ALL USING (is_store_owner(store_id))
    WITH CHECK (is_store_owner(store_id));

CREATE POLICY "Super admin can view all imports" ON public.product_library_imports
    FOR SELECT USING (is_super_admin());

-- Add missing fields to product_library table
ALTER TABLE public.product_library 
ADD COLUMN IF NOT EXISTS base_cost numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_cost numeric NOT NULL DEFAULT 0;

-- Add meta fields to products table for SEO
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS meta_description text;

-- Create function to update product_library_imports updated_at
CREATE OR REPLACE FUNCTION public.update_product_library_imports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product_library_imports updated_at
DROP TRIGGER IF EXISTS update_product_library_imports_updated_at ON public.product_library_imports;
CREATE TRIGGER update_product_library_imports_updated_at
    BEFORE UPDATE ON public.product_library_imports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_library_imports_updated_at();