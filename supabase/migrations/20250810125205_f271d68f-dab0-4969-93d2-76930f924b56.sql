
-- 1) Per-product shipping/returns settings
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS free_shipping_min_amount numeric NULL,
  ADD COLUMN IF NOT EXISTS easy_returns_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS easy_returns_days integer NULL;

COMMENT ON COLUMN public.products.free_shipping_min_amount IS 'If set, show "Free shipping on orders over X" for this product';
COMMENT ON COLUMN public.products.easy_returns_enabled IS 'If true, show "Easy Returns" for this product';
COMMENT ON COLUMN public.products.easy_returns_days IS 'Optional number of days for easy returns (e.g., 30)';

-- 2) Product reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  product_id uuid NOT NULL,
  reviewer_name text NOT NULL,
  reviewer_email text,
  reviewer_phone text,
  rating integer NOT NULL,
  title text,
  comment text,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_reviews_rating_range CHECK (rating >= 1 AND rating <= 5)
);

-- Keep store_id in sync with the product’s store to prevent spoofing
CREATE OR REPLACE FUNCTION public.product_reviews_set_store_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Set store_id from the product to ensure consistency
  SELECT p.store_id INTO NEW.store_id
  FROM public.products p
  WHERE p.id = NEW.product_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_reviews_set_store_id ON public.product_reviews;
CREATE TRIGGER trg_product_reviews_set_store_id
BEFORE INSERT ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.product_reviews_set_store_id();

-- Update updated_at on changes
DROP TRIGGER IF EXISTS trg_product_reviews_set_updated_at ON public.product_reviews;
CREATE TRIGGER trg_product_reviews_set_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_store_id ON public.product_reviews (store_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_visible ON public.product_reviews (is_visible);

-- RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Public: allow reading visible reviews for active products from active stores
DROP POLICY IF EXISTS "Anyone can view visible reviews for active products" ON public.product_reviews;
CREATE POLICY "Anyone can view visible reviews for active products"
  ON public.product_reviews
  FOR SELECT
  USING (
    is_visible = true
    AND EXISTS (
      SELECT 1
      FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_id
        AND p.is_active = true
        AND s.is_active = true
    )
  );

-- Public: allow submitting reviews for active products (store_id enforced via trigger)
DROP POLICY IF EXISTS "Anyone can create a review for active product" ON public.product_reviews;
CREATE POLICY "Anyone can create a review for active product"
  ON public.product_reviews
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_id
        AND p.is_active = true
        AND s.is_active = true
    )
  );

-- Store owners: full manage access on their reviews
DROP POLICY IF EXISTS "Store owners can manage product reviews" ON public.product_reviews;
CREATE POLICY "Store owners can manage product reviews"
  ON public.product_reviews
  FOR ALL
  USING (is_store_owner(store_id))
  WITH CHECK (is_store_owner(store_id));
