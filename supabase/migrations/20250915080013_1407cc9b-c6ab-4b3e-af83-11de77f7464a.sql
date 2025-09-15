-- Clean up website_pages that belong to inactive websites or inactive stores
DELETE FROM public.website_pages 
WHERE website_id IN (
  SELECT w.id 
  FROM public.websites w
  LEFT JOIN public.stores s ON s.id = w.store_id
  WHERE w.is_active = false OR s.is_active = false
) OR website_id NOT IN (
  SELECT id FROM public.websites
);