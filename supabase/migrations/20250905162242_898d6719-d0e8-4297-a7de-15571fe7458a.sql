-- Update the check constraint to allow 'read_only' status
ALTER TABLE public.profiles 
DROP CONSTRAINT profiles_account_status_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_account_status_check 
CHECK (account_status = ANY (ARRAY['active'::text, 'suspended'::text, 'trial'::text, 'expired'::text, 'read_only'::text]));

-- Update expired trial users to read_only status
UPDATE public.profiles 
SET account_status = 'read_only', updated_at = now()
WHERE account_status = 'trial' 
  AND trial_expires_at IS NOT NULL 
  AND trial_expires_at < now();

-- Update expired active subscription users to read_only status  
UPDATE public.profiles
SET account_status = 'read_only', updated_at = now()
WHERE account_status = 'active'
  AND subscription_expires_at IS NOT NULL
  AND subscription_expires_at < now();