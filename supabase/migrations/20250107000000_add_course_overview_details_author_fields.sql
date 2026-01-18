-- Add new fields to courses table for course overview, details, and author information

-- Add overview field (supports text or video URL)
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS overview TEXT;

-- Add course_details field (rich text content)
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS course_details TEXT;

-- Add author fields
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS author_image_url TEXT;
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS author_details TEXT;

-- Update payment_methods default to include stripe
-- Note: This only affects new courses, existing courses will keep their current payment_methods
-- We'll handle stripe in the application layer for existing courses
