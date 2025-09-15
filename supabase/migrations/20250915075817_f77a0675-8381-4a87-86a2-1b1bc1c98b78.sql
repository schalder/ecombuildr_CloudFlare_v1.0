-- Clean up orphaned pages that belong to stores without any websites
DELETE FROM public.pages 
WHERE store_id IN (
  SELECT DISTINCT p.store_id 
  FROM public.pages p
  LEFT JOIN public.websites w ON w.store_id = p.store_id
  WHERE w.id IS NULL
);