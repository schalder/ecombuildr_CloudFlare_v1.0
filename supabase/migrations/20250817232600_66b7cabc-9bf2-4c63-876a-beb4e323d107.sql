-- Fix pricing plans to match the correct structure
-- Update pricing to match the user's actual plans
UPDATE site_pricing_plans 
SET 
  price_bdt = 500,
  plan_name = 'starter'
WHERE plan_name = 'free';

UPDATE site_pricing_plans 
SET 
  price_bdt = 1500,
  plan_name = 'professional'
WHERE plan_name = 'basic';

UPDATE site_pricing_plans 
SET 
  price_bdt = 2999,
  plan_name = 'enterprise'
WHERE plan_name = 'pro';