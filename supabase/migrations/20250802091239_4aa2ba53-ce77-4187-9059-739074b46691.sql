-- Add public read access for products on storefront
CREATE POLICY "Anyone can view active products from active stores" 
ON public.products 
FOR SELECT 
USING (
  is_active = true AND 
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = products.store_id 
    AND stores.is_active = true
  )
);

-- Add public read access for categories on storefront
CREATE POLICY "Anyone can view categories from active stores" 
ON public.categories 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = categories.store_id 
    AND stores.is_active = true
  )
);