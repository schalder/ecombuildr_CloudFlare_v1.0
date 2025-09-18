-- Add member area welcome text fields to stores table
ALTER TABLE public.stores 
ADD COLUMN member_area_welcome_headline text,
ADD COLUMN member_area_welcome_subheadline text;