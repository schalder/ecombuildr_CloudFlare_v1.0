-- First, create the missing trigger to sync profiles when subscriptions change
CREATE TRIGGER sync_profile_on_subscription_change
  AFTER INSERT OR UPDATE ON public.saas_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_with_subscription();

-- Update the sync function to properly handle trial-to-active transitions
CREATE OR REPLACE FUNCTION public.sync_profile_with_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
begin
  if new.subscription_status = 'active'
     and (new.expires_at is null or new.expires_at > now()) then

    update public.profiles p
    set
      -- Set plan from plan_limits; if not found, keep existing value
      subscription_plan = coalesce((
        select pl.plan_name
        from public.plan_limits pl
        where pl.plan_name::text = new.plan_name
        limit 1
      ), p.subscription_plan),
      account_status = 'active',
      subscription_expires_at = new.expires_at,
      -- Clear trial dates when user upgrades to active subscription
      trial_expires_at = null,
      trial_started_at = null,
      updated_at = now()
    where p.id = new.user_id;

  else
    -- On expired/cancelled subscriptions, fall back to trial if still valid, else read_only
    update public.profiles p
    set
      account_status = case
        when p.trial_expires_at is not null and p.trial_expires_at > now() then 'trial'
        else 'read_only'
      end,
      subscription_expires_at = new.expires_at,
      updated_at = now()
    where p.id = new.user_id;
  end if;

  return new;
end;
$function$;

-- Fix existing data: Update users who have active subscriptions but wrong status
UPDATE public.profiles p
SET 
  account_status = 'active',
  subscription_expires_at = s.expires_at,
  trial_expires_at = null,
  trial_started_at = null,
  updated_at = now()
FROM public.saas_subscriptions s
WHERE p.id = s.user_id 
  AND s.subscription_status = 'active'
  AND (s.expires_at is null OR s.expires_at > now())
  AND p.account_status != 'active';

-- Also update subscription_plan from the most recent active subscription
UPDATE public.profiles p
SET 
  subscription_plan = coalesce((
    select pl.plan_name
    from public.plan_limits pl
    join public.saas_subscriptions s on s.plan_name = pl.plan_name::text
    where s.user_id = p.id 
      and s.subscription_status = 'active'
      and (s.expires_at is null or s.expires_at > now())
    order by s.created_at desc
    limit 1
  ), p.subscription_plan),
  updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM public.saas_subscriptions s 
  WHERE s.user_id = p.id 
    AND s.subscription_status = 'active'
    AND (s.expires_at is null OR s.expires_at > now())
);