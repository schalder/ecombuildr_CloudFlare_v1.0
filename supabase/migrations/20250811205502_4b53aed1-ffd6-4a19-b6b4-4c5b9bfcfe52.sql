-- Add product-level action buttons config and allowed payment methods
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS action_buttons jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS allowed_payment_methods text[];