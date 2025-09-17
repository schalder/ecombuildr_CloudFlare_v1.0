-- Add missing columns to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS includes_title TEXT,
ADD COLUMN IF NOT EXISTS includes_items TEXT[];