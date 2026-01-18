-- Add show_content field to courses table to control visibility of course content section
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS show_content BOOLEAN DEFAULT false;
