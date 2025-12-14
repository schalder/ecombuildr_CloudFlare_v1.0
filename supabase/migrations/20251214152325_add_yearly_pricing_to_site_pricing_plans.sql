-- Add yearly pricing column to site_pricing_plans table
ALTER TABLE public.site_pricing_plans 
ADD COLUMN IF NOT EXISTS price_yearly_bdt NUMERIC DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.site_pricing_plans.price_yearly_bdt IS 'Yearly price in BDT. If NULL, yearly pricing is not available for this plan.';

