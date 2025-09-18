-- Add category support to courses table
ALTER TABLE public.courses 
ADD COLUMN category_id uuid REFERENCES public.categories(id);

-- Add course library settings to stores table
ALTER TABLE public.stores 
ADD COLUMN course_library_headline text,
ADD COLUMN course_library_subheadline text;