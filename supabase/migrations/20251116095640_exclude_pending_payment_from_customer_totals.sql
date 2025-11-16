-- Migration: Exclude pending_payment orders from customer totals
-- This ensures that incomplete orders (pending_payment status) are not counted
-- in customer total_orders and total_spent calculations

-- 1) Update sync_customer_from_order() function to exclude pending_payment orders
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
  -- Skip cancelled and pending_payment orders
  if NEW.status = 'cancelled' or NEW.status = 'pending_payment' then
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
  -- Exclude cancelled and pending_payment orders from totals
  update public.customers
  set
    total_orders = (
      select count(*) from public.orders
      where customer_id = customer_record.id 
        and status != 'cancelled' 
        and status != 'pending_payment'
    ),
    total_spent = (
      select coalesce(sum(total), 0)
      from public.orders
      where customer_id = customer_record.id 
        and status != 'cancelled' 
        and status != 'pending_payment'
    ),
    updated_at = now()
  where id = customer_record.id;

  return NEW;
end;
$function$;

-- 2) Recalculate all existing customer totals excluding pending_payment orders
update public.customers c
set
  total_orders = sub.cnt,
  total_spent  = sub.sum,
  updated_at   = now()
from (
  select 
    customer_id, 
    count(*)::int as cnt, 
    coalesce(sum(total), 0)::numeric as sum
  from public.orders
  where status != 'cancelled' 
    and status != 'pending_payment' 
    and customer_id is not null
  group by customer_id
) sub
where c.id = sub.customer_id;

-- 3) Set total_orders and total_spent to 0 for customers who only have pending_payment orders
update public.customers c
set
  total_orders = 0,
  total_spent = 0,
  updated_at = now()
where c.id not in (
  select distinct customer_id 
  from public.orders 
  where customer_id is not null 
    and status != 'cancelled' 
    and status != 'pending_payment'
);

