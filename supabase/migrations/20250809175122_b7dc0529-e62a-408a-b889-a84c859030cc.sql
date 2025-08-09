-- Add extended shipping fields and custom_fields to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_country text NULL,
  ADD COLUMN IF NOT EXISTS shipping_state text NULL,
  ADD COLUMN IF NOT EXISTS shipping_postal_code text NULL,
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NULL DEFAULT '{}'::jsonb;