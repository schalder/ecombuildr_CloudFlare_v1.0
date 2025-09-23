-- Create function to check if phone exists with normalization
CREATE OR REPLACE FUNCTION check_phone_exists(normalized_phone text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  phone_exists boolean := false;
BEGIN
  -- Check if any profile has this normalized phone number
  SELECT EXISTS(
    SELECT 1 FROM profiles 
    WHERE phone IS NOT NULL 
    AND (
      -- Direct match
      phone = normalized_phone
      -- Or normalized versions match
      OR CASE 
        WHEN phone ~ '^\+880' THEN phone
        WHEN phone ~ '^880' THEN '+' || phone
        WHEN phone ~ '^0' THEN '+880' || substring(phone from 2)
        WHEN length(phone) = 11 AND phone ~ '^[0-9]+$' THEN '+880' || phone
        WHEN length(phone) = 10 AND phone ~ '^[0-9]+$' THEN '+880' || phone
        ELSE CASE WHEN phone ~ '^[0-9]+$' AND length(phone) > 10 THEN '+' || phone ELSE phone END
      END = normalized_phone
    )
  ) INTO phone_exists;
  
  RETURN phone_exists;
END;
$$;