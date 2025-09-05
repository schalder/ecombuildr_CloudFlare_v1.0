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

-- Schedule the account-enforcement function to run daily at 2 AM
SELECT cron.schedule(
  'daily-account-enforcement',
  '0 2 * * *', -- Daily at 2 AM
  $$
  SELECT net.http_post(
    url := 'https://fhqwacmokbtbspkxjixf.supabase.co/functions/v1/account-enforcement',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);