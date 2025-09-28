-- Add drip content functionality to course_lessons table
ALTER TABLE public.course_lessons 
ADD COLUMN drip_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN drip_type text CHECK (drip_type IN ('days_after_purchase', 'specific_date')) DEFAULT 'days_after_purchase',
ADD COLUMN drip_days integer DEFAULT 0,
ADD COLUMN drip_release_date timestamp with time zone DEFAULT NULL,
ADD COLUMN drip_lock_message text DEFAULT 'This lesson will be available after you complete the prerequisites.';