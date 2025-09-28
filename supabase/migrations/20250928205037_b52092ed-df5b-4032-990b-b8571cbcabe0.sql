-- Add theme_settings column to courses table for customizable UI elements
ALTER TABLE public.courses 
ADD COLUMN theme_settings jsonb DEFAULT '{"module_color": "#3b82f6"}'::jsonb;