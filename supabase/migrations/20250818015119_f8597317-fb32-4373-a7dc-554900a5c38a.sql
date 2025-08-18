
-- 1) Replace handle_new_user to initialize trial fields from plan_limits and selected_plan
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  selected_plan_text text;
  selected_plan_enum public.plan_limits.plan_name%type;
  plan_days integer;
begin
  -- Read selected plan from user metadata; fallback to 'starter'
  selected_plan_text := coalesce(nullif(new.raw_user_meta_data->>'selected_plan', ''), 'starter');

  -- Prefer a plan that exists in plan_limits; fallback to 'starter'
  select pl.plan_name, pl.trial_days
  into selected_plan_enum, plan_days
  from public.plan_limits pl
  where pl.plan_name::text = selected_plan_text
  limit 1;

  if selected_plan_enum is null then
    select pl.plan_name, pl.trial_days
    into selected_plan_enum, plan_days
    from public.plan_limits pl
    where pl.plan_name::text = 'starter'
    limit 1;
  end if;

  plan_days := coalesce(plan_days, 7);

  insert into public.profiles (
    id, email, full_name,
    subscription_plan, account_status,
    trial_started_at, trial_expires_at, created_at, updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    selected_plan_enum,
    'trial',
    now(),
    now() + make_interval(days => plan_days),
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 2) Ensure trigger exists on auth.users to invoke handle_new_user after signup
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end;
$$;

-- 3) Keep profiles in sync with subscriptions: function + trigger on saas_subscriptions
create or replace function public.sync_profile_with_subscription()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if new.subscription_status = 'active'
     and (new.expires_at is null or new.expires_at > now()) then

    update public.profiles p
    set
      -- set enum from plan_limits; if not found, keep existing value
      subscription_plan = coalesce((
        select pl.plan_name
        from public.plan_limits pl
        where pl.plan_name::text = new.plan_name
        limit 1
      ), p.subscription_plan),
      account_status = 'active',
      subscription_expires_at = new.expires_at,
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
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'sync_profile_with_subscription_trg') then
    create trigger sync_profile_with_subscription_trg
      after insert or update on public.saas_subscriptions
      for each row execute procedure public.sync_profile_with_subscription();
  end if;
end;
$$;

-- 4) Improve defaults: no "free plan", start as trial by default
alter table public.profiles
  alter column subscription_plan set default 'starter'::subscription_plan,
  alter column account_status set default 'trial';

-- 5) Backfill existing profiles missing trial info (safe for already-active subscribers)
with params as (
  select
    u.id as user_id,
    coalesce(nullif(u.raw_user_meta_data->>'selected_plan',''), 'starter') as selected_plan,
    coalesce(pl.trial_days, 7) as trial_days,
    pl.plan_name as plan_enum
  from auth.users u
  left join public.plan_limits pl
    on pl.plan_name::text = coalesce(nullif(u.raw_user_meta_data->>'selected_plan',''), 'starter')
)
update public.profiles p
set
  subscription_plan = coalesce(
    p.subscription_plan,
    (select plan_enum from params where params.user_id = p.id)
  ),
  account_status = case
    -- Only force to trial if there is no active subscription recorded
    when (p.trial_started_at is null or p.trial_expires_at is null)
         and (p.subscription_expires_at is null or p.subscription_expires_at <= now())
      then 'trial'
    else p.account_status
  end,
  trial_started_at = coalesce(p.trial_started_at, now()),
  trial_expires_at = coalesce(
    p.trial_expires_at,
    now() + make_interval(days => (select trial_days from params where params.user_id = p.id))
  ),
  updated_at = now()
where p.id in (select user_id from params)
  and (
    p.subscription_plan is null
    or p.trial_started_at is null
    or p.trial_expires_at is null
  );
