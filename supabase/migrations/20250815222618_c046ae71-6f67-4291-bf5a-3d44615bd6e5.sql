
-- 1) Global payment options table (managed by super admin, readable by authenticated users)
create table if not exists public.platform_payment_options (
  id uuid primary key default gen_random_uuid(),
  provider text not null,                              -- e.g. 'bkash', 'nagad'
  display_name text,                                   -- e.g. 'bKash', 'Nagad'
  is_enabled boolean not null default false,
  account_number text,                                 -- payment number to show users
  instructions text,                                   -- optional extra instructions to display
  updated_by uuid,                                     -- auth user id of last editor (optional)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_payment_options_provider_unique unique (provider)
);

alter table public.platform_payment_options enable row level security;

-- Authenticated users can read options to render payment step
create policy "Authenticated users can view payment options"
on public.platform_payment_options
for select
using (auth.uid() is not null);

-- Only super admins can manage
create policy "Super admin can manage payment options"
on public.platform_payment_options
for all
using (public.is_super_admin())
with check (public.is_super_admin());

-- Keep updated_at fresh
drop trigger if exists platform_payment_options_set_updated_at on public.platform_payment_options;
create trigger platform_payment_options_set_updated_at
before update on public.platform_payment_options
for each row
execute procedure public.update_updated_at_column();

-- Seed initial providers (safe if re-run)
insert into public.platform_payment_options
  (provider, display_name, is_enabled, account_number, instructions)
values
  ('bkash', 'bKash', true,  '01303119151', 'bKash Personal: উপরের নম্বরে Send Money করুন, তারপর Transaction ID নিচে দিন।'),
  ('nagad', 'Nagad', false, null,          'Nagad Personal: উপরের নম্বরে Send Money করুন, তারপর Transaction ID নিচে দিন।')
on conflict (provider) do nothing;

-- 2) Allow users to submit their own subscription payment requests
-- Current policies allow super admin to manage and users to SELECT own rows.
-- Add INSERT so a user can create a pending record tied to themselves.
create policy "Users can submit their own subscription requests"
on public.saas_subscriptions
for insert
with check (user_id = auth.uid());

-- Helpful indexes for admin views
create index if not exists idx_saas_subscriptions_user_id on public.saas_subscriptions(user_id);
create index if not exists idx_saas_subscriptions_status on public.saas_subscriptions(subscription_status);
