
-- 1) Helper for consistent phone normalization
create or replace function public.normalize_phone(p text)
returns text
language sql
immutable
as $$
  select case
    when p is null then null
    else regexp_replace(p, '[^0-9+]', '', 'g')
  end
$$;

-- 2) Update sync function to strict email/phone matching (no name fallback)
create or replace function public.sync_customer_from_order()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  customer_record public.customers%rowtype;
  normalized_new_phone text := public.normalize_phone(NEW.customer_phone);
begin
  -- Skip cancelled orders
  if NEW.status = 'cancelled' then
    return NEW;
  end if;

  -- 2a) Try email match first (case-insensitive within same store)
  if NEW.customer_email is not null and NEW.customer_email <> '' then
    select *
    into customer_record
    from public.customers c
    where c.store_id = NEW.store_id
      and c.email is not null
      and lower(c.email) = lower(NEW.customer_email)
    limit 1;
  end if;

  -- 2b) If not found, try phone match (normalized) within same store
  if customer_record.id is null
     and normalized_new_phone is not null
     and normalized_new_phone <> '' then
    select *
    into customer_record
    from public.customers c
    where c.store_id = NEW.store_id
      and c.phone is not null
      and public.normalize_phone(c.phone) = normalized_new_phone
    limit 1;
  end if;

  -- 2c) Create or update customer
  if customer_record.id is null then
    -- Create a new customer
    insert into public.customers (
      store_id, full_name, email, phone, city, area, created_at, updated_at
    ) values (
      NEW.store_id,
      coalesce(nullif(trim(NEW.customer_name), ''), 'Customer'),
      NEW.customer_email,
      NEW.customer_phone,
      NEW.shipping_city,
      NEW.shipping_area,
      now(),
      now()
    ) returning * into customer_record;
  else
    -- Enrich only NULL fields to avoid overwriting existing customer data
    update public.customers
    set
      full_name = coalesce(full_name, nullif(trim(NEW.customer_name), '')),
      email     = coalesce(email, NEW.customer_email),
      phone     = coalesce(phone, NEW.customer_phone),
      city      = coalesce(city, NEW.shipping_city),
      area      = coalesce(area, NEW.shipping_area),
      updated_at = now()
    where id = customer_record.id;
  end if;

  -- 2d) Link order to the customer if needed
  if NEW.customer_id is distinct from customer_record.id then
    update public.orders
    set customer_id = customer_record.id
    where id = NEW.id;
  end if;

  -- 2e) Recalculate totals for this customer
  update public.customers
  set
    total_orders = (
      select count(*) from public.orders
      where customer_id = customer_record.id and status != 'cancelled'
    ),
    total_spent = (
      select coalesce(sum(total), 0)
      from public.orders
      where customer_id = customer_record.id and status != 'cancelled'
    ),
    updated_at = now()
  where id = customer_record.id;

  return NEW;
end;
$function$;

-- 3) Ensure orders trigger exists
drop trigger if exists orders_customer_sync on public.orders;

create trigger orders_customer_sync
after insert or update of customer_name, customer_email, customer_phone, shipping_city, shipping_area, status
on public.orders
for each row
execute function public.sync_customer_from_order();

-- 4) Add indexes to speed up matching
create index if not exists idx_customers_store_lower_email
  on public.customers (store_id, lower(email))
  where email is not null;

create index if not exists idx_customers_store_normalized_phone
  on public.customers (store_id, public.normalize_phone(phone))
  where phone is not null;

-- 5) One-time backfill: link existing orders without a customer, then recompute totals
do $$
declare
  r record;
  matched_customer_id uuid;
begin
  for r in
    select o.*
    from public.orders o
    where o.customer_id is null and o.status != 'cancelled'
  loop
    matched_customer_id := null;

    -- Try email first
    if r.customer_email is not null and r.customer_email <> '' then
      select c.id into matched_customer_id
      from public.customers c
      where c.store_id = r.store_id
        and c.email is not null
        and lower(c.email) = lower(r.customer_email)
      limit 1;
    end if;

    -- Then try phone
    if matched_customer_id is null
       and r.customer_phone is not null and r.customer_phone <> '' then
      select c.id into matched_customer_id
      from public.customers c
      where c.store_id = r.store_id
        and c.phone is not null
        and public.normalize_phone(c.phone) = public.normalize_phone(r.customer_phone)
      limit 1;
    end if;

    -- Create if still not found
    if matched_customer_id is null then
      insert into public.customers (store_id, full_name, email, phone, city, area, created_at, updated_at)
      values (
        r.store_id,
        coalesce(nullif(trim(r.customer_name), ''), 'Customer'),
        r.customer_email,
        r.customer_phone,
        r.shipping_city,
        r.shipping_area,
        now(),
        now()
      )
      returning id into matched_customer_id;
    else
      -- Enrich only NULL fields of the matched customer
      update public.customers
      set
        full_name = coalesce(full_name, nullif(trim(r.customer_name), '')),
        email     = coalesce(email, r.customer_email),
        phone     = coalesce(phone, r.customer_phone),
        city      = coalesce(city, r.shipping_city),
        area      = coalesce(area, r.shipping_area),
        updated_at = now()
      where id = matched_customer_id;
    end if;

    -- Link the order to the customer
    update public.orders
    set customer_id = matched_customer_id
    where id = r.id;
  end loop;

  -- Recompute totals for all customers
  update public.customers c
  set
    total_orders = sub.cnt,
    total_spent  = sub.sum,
    updated_at   = now()
  from (
    select customer_id, count(*)::int as cnt, coalesce(sum(total), 0)::numeric as sum
    from public.orders
    where status != 'cancelled' and customer_id is not null
    group by customer_id
  ) sub
  where c.id = sub.customer_id;
end $$;
