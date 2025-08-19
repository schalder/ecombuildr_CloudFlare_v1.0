-- Fix product_reviews security by creating public view and updating RLS policies

-- Step 1: Drop the existing public access policy that exposes sensitive data
DROP POLICY IF EXISTS "Anyone can view visible reviews for active products" ON public.product_reviews;

-- Step 2: Update existing policies to require authentication for full access
DROP POLICY IF EXISTS "Store owners can manage product reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Anyone can create a review for active product" ON public.product_reviews;

-- Step 3: Create secure RLS policies for authenticated users only
CREATE POLICY "Store owners can manage product reviews" 
ON public.product_reviews 
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND is_store_owner(store_id)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND is_store_owner(store_id)
);

CREATE POLICY "Authenticated users can create reviews for active products" 
ON public.product_reviews 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1
    FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_reviews.product_id 
      AND p.is_active = true 
      AND s.is_active = true
  )
);

CREATE POLICY "Store owners can view all review details" 
ON public.product_reviews 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND is_store_owner(store_id)
);

-- Step 4: Create a public view that excludes sensitive personal information
CREATE OR REPLACE VIEW public.product_reviews_public AS
SELECT 
  id,
  store_id,
  product_id,
  reviewer_name,
  rating,
  title,
  comment,
  is_visible,
  created_at,
  updated_at
FROM public.product_reviews
WHERE is_visible = true
  AND EXISTS (
    SELECT 1
    FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_reviews.product_id 
      AND p.is_active = true 
      AND s.is_active = true
  );

-- Step 5: Grant public access to the safe view
GRANT SELECT ON public.product_reviews_public TO anon;
GRANT SELECT ON public.product_reviews_public TO authenticated;