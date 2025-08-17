-- Add weight and shipping configuration to products table
ALTER TABLE public.products 
ADD COLUMN weight_grams integer DEFAULT 0,
ADD COLUMN shipping_config jsonb DEFAULT '{
  "type": "default",
  "fixedFee": 0,
  "weightSurcharge": 0,
  "freeShippingEnabled": false
}'::jsonb;

-- Add weight tiers and free shipping threshold to website shipping settings
-- This will extend the existing settings.shipping structure