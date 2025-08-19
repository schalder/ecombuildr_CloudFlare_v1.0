-- Complete security fix for product_reviews table
-- Step 1: Remove the problematic view
DROP VIEW IF EXISTS public.product_reviews_public;

-- Step 2: Ensure NO public access to the main table
-- (The previous migration already removed public policies, but let's be explicit)
DROP POLICY IF EXISTS "Anyone can view visible reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Public can view reviews" ON public.product_reviews;

-- Step 3: Verify only authenticated access policies exist
-- The table should now have only these policies:
-- - Store owners can manage product reviews (for authenticated users)
-- - Authenticated users can create reviews for active products
-- - Store owners can view all review details

-- Step 4: Create a secure function to get public reviews (without sensitive data)
CREATE OR REPLACE FUNCTION public.get_public_reviews(product_uuid uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  store_id uuid,
  product_id uuid,
  reviewer_name text,
  rating integer,
  title text,
  comment text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.store_id,
    pr.product_id,
    pr.reviewer_name,
    pr.rating,
    pr.title,
    pr.comment,
    pr.created_at
  FROM product_reviews pr
  JOIN products p ON p.id = pr.product_id
  JOIN stores s ON s.id = p.store_id
  WHERE pr.is_visible = true
    AND p.is_active = true
    AND s.is_active = true
    AND (product_uuid IS NULL OR pr.product_id = product_uuid);
END;
$$;

-- Step 5: Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_reviews(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_reviews(uuid) TO authenticated;

-- Step 6: Create function to safely submit reviews (for authenticated users)
CREATE OR REPLACE FUNCTION public.submit_product_review(
  product_uuid uuid,
  reviewer_name_param text,
  rating_param integer,
  title_param text DEFAULT NULL,
  comment_param text DEFAULT NULL,
  reviewer_email_param text DEFAULT NULL,
  reviewer_phone_param text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  review_id uuid;
  store_uuid uuid;
BEGIN
  -- Get store_id from product
  SELECT p.store_id INTO store_uuid
  FROM products p
  JOIN stores s ON s.id = p.store_id
  WHERE p.id = product_uuid 
    AND p.is_active = true 
    AND s.is_active = true;

  IF store_uuid IS NULL THEN
    RAISE EXCEPTION 'Product not found or not active';
  END IF;

  -- Insert the review
  INSERT INTO product_reviews (
    store_id,
    product_id,
    reviewer_name,
    reviewer_email,
    reviewer_phone,
    rating,
    title,
    comment
  ) VALUES (
    store_uuid,
    product_uuid,
    reviewer_name_param,
    reviewer_email_param,
    reviewer_phone_param,
    rating_param,
    title_param,
    comment_param
  ) RETURNING id INTO review_id;

  RETURN review_id;
END;
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.submit_product_review(uuid, text, integer, text, text, text, text) TO authenticated;