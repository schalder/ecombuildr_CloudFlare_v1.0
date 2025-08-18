-- Clear trial dates for all users with active subscriptions
UPDATE public.profiles p
SET 
  trial_expires_at = null,
  trial_started_at = null,
  updated_at = now()
WHERE p.account_status = 'active'
  AND p.trial_expires_at IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.saas_subscriptions s 
    WHERE s.user_id = p.id 
      AND s.subscription_status = 'active'
      AND (s.expires_at is null OR s.expires_at > now())
  );