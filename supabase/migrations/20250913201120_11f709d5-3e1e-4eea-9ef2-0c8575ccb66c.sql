-- First, disable the trigger temporarily to allow batch inserts
ALTER TABLE public.category_website_visibility DISABLE TRIGGER ALL;

-- Backfill category_website_visibility for existing categories
-- All existing categories should be visible on all websites by default
INSERT INTO public.category_website_visibility (category_id, website_id)
SELECT DISTINCT c.id as category_id, w.id as website_id
FROM public.categories c
CROSS JOIN public.websites w
WHERE c.store_id = w.store_id
AND NOT EXISTS (
  SELECT 1 
  FROM public.category_website_visibility cwv 
  WHERE cwv.category_id = c.id AND cwv.website_id = w.id
)
ON CONFLICT (category_id, website_id) DO NOTHING;

-- Re-enable the trigger
ALTER TABLE public.category_website_visibility ENABLE TRIGGER ALL;