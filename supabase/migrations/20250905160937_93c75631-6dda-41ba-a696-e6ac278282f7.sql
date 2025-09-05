
-- 1) Trigger function: when a profile becomes read_only, deactivate all their sites & funnels
create or replace function public.enforce_read_only_on_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.account_status = 'read_only'
     and (old.account_status is distinct from 'read_only') then

    -- Deactivate all websites owned by this user (via their stores)
    update public.websites w
    set is_active = false
    from public.stores s
    where w.store_id = s.id
      and s.owner_id = new.id
      and w.is_active = true;

    -- Deactivate all funnels owned by this user (via their stores)
    update public.funnels f
    set is_active = false
    from public.stores s
    where f.store_id = s.id
      and s.owner_id = new.id
      and f.is_active = true;
  end if;

  return new;
end;
$$;

-- Recreate trigger to ensure latest logic is used
drop trigger if exists trg_enforce_read_only_on_profile_update on public.profiles;

create trigger trg_enforce_read_only_on_profile_update
after update on public.profiles
for each row
execute function public.enforce_read_only_on_profile_update();

-- 2) Backfill: immediately enforce privacy for existing read_only accounts

-- Deactivate websites for all profiles already in read_only
update public.websites w
set is_active = false
from public.stores s, public.profiles p
where w.store_id = s.id
  and s.owner_id = p.id
  and p.account_status = 'read_only'
  and w.is_active = true;

-- Deactivate funnels for all profiles already in read_only
update public.funnels f
set is_active = false
from public.stores s, public.profiles p
where f.store_id = s.id
  and s.owner_id = p.id
  and p.account_status = 'read_only'
  and f.is_active = true;
