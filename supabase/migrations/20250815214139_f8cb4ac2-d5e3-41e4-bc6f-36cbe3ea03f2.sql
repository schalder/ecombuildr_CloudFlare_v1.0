-- Create product_website_visibility table
CREATE TABLE public.product_website_visibility (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL,
  website_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_id, website_id)
);

-- Create category_website_visibility table  
CREATE TABLE public.category_website_visibility (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid NOT NULL,
  website_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(category_id, website_id)
);

-- Add website_id to funnels table
ALTER TABLE public.funnels ADD COLUMN website_id uuid;

-- Enable RLS on new tables
ALTER TABLE public.product_website_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_website_visibility ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_website_visibility
CREATE POLICY "Store owners can manage product website visibility" 
ON public.product_website_visibility 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.products p 
    JOIN public.websites w ON w.id = product_website_visibility.website_id
    WHERE p.id = product_website_visibility.product_id 
    AND is_store_owner(p.store_id) 
    AND is_store_owner(w.store_id)
  )
);

CREATE POLICY "Anyone can view product website visibility for active sites" 
ON public.product_website_visibility 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.websites w 
    WHERE w.id = product_website_visibility.website_id 
    AND w.is_active = true 
    AND w.is_published = true
  )
);

-- RLS policies for category_website_visibility
CREATE POLICY "Store owners can manage category website visibility" 
ON public.category_website_visibility 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.categories c
    JOIN public.websites w ON w.id = category_website_visibility.website_id
    WHERE c.id = category_website_visibility.category_id 
    AND is_store_owner(c.store_id) 
    AND is_store_owner(w.store_id)
  )
);

CREATE POLICY "Anyone can view category website visibility for active sites" 
ON public.category_website_visibility 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.websites w 
    WHERE w.id = category_website_visibility.website_id 
    AND w.is_active = true 
    AND w.is_published = true
  )
);

-- Update funnels RLS policy to include website_id check
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
);