-- Add course currency settings to stores table
ALTER TABLE public.stores 
ADD COLUMN course_currency TEXT DEFAULT 'USD' CHECK (course_currency IN ('USD', 'BDT', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'));

-- Update existing stores to have default currency
UPDATE public.stores SET course_currency = 'USD' WHERE course_currency IS NULL;