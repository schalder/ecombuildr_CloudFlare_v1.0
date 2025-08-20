-- Update the handle_new_user function to extract phone from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
language plpgsql
security definer set search_path = public 
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
    id, email, full_name, phone,
    subscription_plan, account_status,
    trial_started_at, trial_expires_at, created_at, updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone',
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