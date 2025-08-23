
-- 1) Table to store Web Push subscriptions per user (owner) and optionally per store
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  store_id uuid references public.stores (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  device text,
  browser text,
  platform text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

-- Useful indexes
create index if not exists idx_push_subscriptions_user_id on public.push_subscriptions (user_id);
create index if not exists idx_push_subscriptions_store_id on public.push_subscriptions (store_id);
create unique index if not exists uniq_push_subscriptions_user_endpoint on public.push_subscriptions (user_id, endpoint);

-- 2) RLS: users can only manage their own subscriptions
alter table public.push_subscriptions enable row level security;

-- Select own
create policy "Users can view their own push subscriptions"
on public.push_subscriptions
for select
using (auth.uid() = user_id);

-- Insert own
create policy "Users can create their own push subscriptions"
on public.push_subscriptions
for insert
with check (auth.uid() = user_id);

-- Update own
create policy "Users can update their own push subscriptions"
on public.push_subscriptions
for update
using (auth.uid() = user_id);

-- Delete own
create policy "Users can delete their own push subscriptions"
on public.push_subscriptions
for delete
using (auth.uid() = user_id);
