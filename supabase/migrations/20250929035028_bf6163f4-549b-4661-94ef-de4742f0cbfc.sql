-- Add status column to course_orders table
ALTER TABLE public.course_orders 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';