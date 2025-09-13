-- Add urgency timer fields to products table
ALTER TABLE public.products 
ADD COLUMN urgency_timer_enabled boolean DEFAULT false,
ADD COLUMN urgency_timer_duration integer DEFAULT 60,
ADD COLUMN urgency_timer_text text DEFAULT 'Limited Time Offer!',
ADD COLUMN urgency_timer_color text DEFAULT '#ef4444',
ADD COLUMN urgency_timer_text_color text DEFAULT '#ffffff';