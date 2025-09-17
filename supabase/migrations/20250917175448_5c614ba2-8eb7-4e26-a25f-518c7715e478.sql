-- Add course favicon and login logo settings to stores table
ALTER TABLE public.stores 
ADD COLUMN course_favicon_url text,
ADD COLUMN course_login_logo_url text;