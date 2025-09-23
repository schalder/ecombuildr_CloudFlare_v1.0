-- Create a function to normalize phone numbers consistently
CREATE OR REPLACE FUNCTION public.normalize_phone_bd(phone_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF phone_input IS NULL OR phone_input = '' THEN
    RETURN NULL;
  END IF;
  
  -- Remove all non-digit characters
  DECLARE
    digits_only text := regexp_replace(phone_input, '[^0-9]', '', 'g');
  BEGIN
    -- Handle different Bangladesh phone formats
    IF digits_only ~ '^88[0-9]{11}$' AND length(digits_only) = 13 THEN
      -- +8801XXXXXXXXX format
      RETURN digits_only;
    ELSIF digits_only ~ '^01[0-9]{9}$' AND length(digits_only) = 11 THEN
      -- 01XXXXXXXXX format
      RETURN '88' || digits_only;
    ELSIF digits_only ~ '^1[0-9]{9}$' AND length(digits_only) = 10 THEN
      -- 1XXXXXXXXX format (missing leading 0)
      RETURN '880' || digits_only;
    END IF;
    
    RETURN digits_only;
  END;
END;
$$;

-- Create a computed column for normalized email (case insensitive)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_normalized text 
GENERATED ALWAYS AS (LOWER(email)) STORED;

-- First, find and mark duplicate phone numbers before creating constraints
-- Add a temporary column to track duplicates
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_duplicate_marker text;

-- Update the duplicate marker for conflicting phone numbers
UPDATE public.profiles 
SET phone_duplicate_marker = 'duplicate_' || id::text
WHERE id IN (
  SELECT p1.id 
  FROM public.profiles p1
  JOIN public.profiles p2 ON public.normalize_phone_bd(p1.phone) = public.normalize_phone_bd(p2.phone)
  WHERE p1.id > p2.id 
    AND public.normalize_phone_bd(p1.phone) IS NOT NULL
    AND public.normalize_phone_bd(p1.phone) != ''
);

-- Create a computed column for normalized phone with duplicate handling
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_normalized text 
GENERATED ALWAYS AS (
  CASE 
    WHEN phone_duplicate_marker IS NOT NULL 
    THEN phone_duplicate_marker 
    ELSE public.normalize_phone_bd(phone) 
  END
) STORED;

-- Create unique indexes to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_normalized 
ON public.profiles (email_normalized) 
WHERE email_normalized IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_normalized 
ON public.profiles (phone_normalized) 
WHERE phone_normalized IS NOT NULL AND phone_duplicate_marker IS NULL;

-- Add a trigger to validate email domains against common typos
CREATE OR REPLACE FUNCTION public.validate_email_domain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  domain_part text;
  typo_domains text[] := ARRAY[
    'gamil.com', 'gmai.com', 'gmail.co', 'gmial.com',
    'yaho.com', 'yahoo.co', 'yahooo.com',
    'hotmial.com', 'hotmai.com', 'hotmil.com',
    'outlok.com', 'outloo.com'
  ];
BEGIN
  IF NEW.email IS NOT NULL THEN
    domain_part := split_part(NEW.email, '@', 2);
    
    -- Check if domain is in the typo list
    IF domain_part = ANY(typo_domains) THEN
      RAISE EXCEPTION 'Invalid email domain: %. Please check your email address.', domain_part;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for email validation
DROP TRIGGER IF EXISTS validate_email_domain_trigger ON public.profiles;
CREATE TRIGGER validate_email_domain_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_email_domain();