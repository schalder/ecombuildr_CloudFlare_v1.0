-- Add preview_image_url columns to website_pages and funnel_steps tables
ALTER TABLE public.website_pages 
ADD COLUMN preview_image_url TEXT;

ALTER TABLE public.funnel_steps 
ADD COLUMN preview_image_url TEXT;