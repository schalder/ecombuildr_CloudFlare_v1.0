
-- Add a toggle to control whether a collection appears as a filter on the Products page
ALTER TABLE public.collections
ADD COLUMN IF NOT EXISTS show_on_products_page boolean NOT NULL DEFAULT false;
