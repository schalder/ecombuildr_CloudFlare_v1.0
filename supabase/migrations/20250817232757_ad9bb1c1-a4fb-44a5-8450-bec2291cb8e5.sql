-- Remove the unnecessary Free Plan since we have trial days system
DELETE FROM site_pricing_plans 
WHERE plan_name = 'starter' AND price_bdt = 500 AND display_name = 'Starter' 
AND EXISTS (
  SELECT 1 FROM site_pricing_plans 
  WHERE plan_name = 'free' OR price_bdt = 0
);

-- Actually, let's be more specific and remove any plan with 0 price
DELETE FROM site_pricing_plans WHERE price_bdt = 0;