-- Add is_new_student column to course_orders table
ALTER TABLE public.course_orders 
ADD COLUMN IF NOT EXISTS is_new_student BOOLEAN DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.course_orders.is_new_student IS 'Indicates whether this order is for a new student (true) or returning student (false)';
