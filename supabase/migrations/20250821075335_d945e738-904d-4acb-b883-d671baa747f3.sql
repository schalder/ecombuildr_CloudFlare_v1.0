-- Create function to get review statistics for multiple products
CREATE OR REPLACE FUNCTION public.get_review_stats_for_products(product_ids uuid[])
RETURNS TABLE(
  product_id uuid,
  rating_average numeric,
  rating_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    COALESCE(ROUND(AVG(pr.rating), 1), 0) as rating_average,
    COALESCE(COUNT(pr.id)::integer, 0) as rating_count
  FROM unnest(product_ids) AS p(id)
  LEFT JOIN product_reviews pr ON pr.product_id = p.id AND pr.is_visible = true
  GROUP BY p.id;
END;
$$;