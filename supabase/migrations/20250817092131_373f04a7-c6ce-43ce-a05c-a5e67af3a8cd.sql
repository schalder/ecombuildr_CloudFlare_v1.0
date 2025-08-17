
-- 1) Function: ensure/attach customers from orders and keep metrics in sync
create or replace function public.sync_customer_from_order()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_email text;
  v_phone text;
  v_customer_id uuid;
begin
  if tg_op = 'DELETE' then
    return old;
  end if;

  -- Normalize email/phone
  v_email := nullif(lower(coalesce(new.customer_email, '')), '');
  v_phone := nullif(new.customer_phone, '');

  -- Try to find existing customer in the same store by email or phone
  select c.id
    into v_customer_id
  from public.customers c
  where c.store_id = new.store_id
    and (
      (v_email is not null and lower(coalesce(c.email,'')) = v_email)
      or (v_phone is not null and coalesce(c.phone,'') = v_phone)
    )
  limit 1;

  -- Create if not found
  if v_customer_id is null then
    insert into public.customers (
      store_id, email, phone, full_name, address, city, area, created_at, updated_at
    ) values (
      new.store_id,
      nullif(new.customer_email,''),
      nullif(new.customer_phone,''),
      coalesce(nullif(new.customer_name,''),'Customer'),
      nullif(new.shipping_address,''),
      nullif(new.shipping_city,''),
      nullif(new.shipping_area,''),
      now(),
      now()
    )
    returning id into v_customer_id;
  else
    -- Update profile with freshest non-null values
    update public.customers
       set full_name = coalesce(new.customer_name, full_name),
           email     = coalesce(nullif(new.customer_email,''), email),
           phone     = coalesce(nullif(new.customer_phone,''), phone),
           address   = coalesce(nullif(new.shipping_address,''), address),
           city      = coalesce(nullif(new.shipping_city,''), city),
           area      = coalesce(nullif(new.shipping_area,''), area),
           updated_at = now()
     where id = v_customer_id;
  end if;

  -- Attach order to this customer if needed
  if new.customer_id is distinct from v_customer_id then
    update public.orders
       set customer_id = v_customer_id
     where id = new.id;
  end if;

  -- Recompute metrics from non-cancelled orders
  update public.customers c
     set total_orders = coalesce((
           select count(*)::int
             from public.orders o
            where o.customer_id = v_customer_id
              and o.store_id = new.store_id
              and o.status <> 'cancelled'::public.order_status
         ), 0),
         total_spent = coalesce((
           select sum(o.total)
             from public.orders o
            where o.customer_id = v_customer_id
              and o.store_id = new.store_id
              and o.status <> 'cancelled'::public.order_status
         ), 0),
         updated_at = now()
   where c.id = v_customer_id;

  return new;
end;
$$;

-- 2) Trigger: fire on order insert/updates of relevant fields
drop trigger if exists on_orders_sync_customer on public.orders;

create trigger on_orders_sync_customer
after insert or update of
  customer_name, customer_phone, customer_email,
  shipping_address, shipping_city, shipping_area,
  total, status
on public.orders
for each row
execute function public.sync_customer_from_order();

-- 3) Backfill: create missing customers from existing orders
with candidates as (
  select
    o.store_id,
    nullif(lower(coalesce(o.customer_email,'')),'') as email,
    nullif(o.customer_phone,'') as phone,
    max(nullif(o.customer_name,'')) as full_name,
    max(nullif(o.shipping_address,'')) as address,
    max(nullif(o.shipping_city,'')) as city,
    max(nullif(o.shipping_area,'')) as area
  from public.orders o
  group by o.store_id, nullif(lower(coalesce(o.customer_email,'')),''),
           nullif(o.customer_phone,'')
)
insert into public.customers (store_id, email, phone, full_name, address, city, area, created_at, updated_at)
select c.store_id,
       c.email,
       c.phone,
       coalesce(c.full_name, 'Customer'),
       c.address, c.city, c.area, now(), now()
from candidates c
left join public.customers existing
  on existing.store_id = c.store_id
 and (
   (c.email is not null and lower(coalesce(existing.email,'')) = c.email)
   or (c.phone is not null and coalesce(existing.phone,'') = c.phone)
 )
where existing.id is null;

-- 4) Attach orders to customers where missing
update public.orders o
   set customer_id = c.id
from public.customers c
where o.customer_id is null
  and o.store_id = c.store_id
  and (
    (c.email is not null and lower(coalesce(o.customer_email,'')) = lower(c.email))
    or (c.phone is not null and coalesce(o.customer_phone,'') = c.phone)
  );

-- 5) Recompute metrics for all customers (non-cancelled orders only)
with agg as (
  select customer_id,
         count(*)::int as cnt,
         coalesce(sum(total),0) as sum_total
    from public.orders
   where customer_id is not null
     and status <> 'cancelled'::public.order_status
   group by customer_id
)
update public.customers c
   set total_orders = a.cnt,
       total_spent = a.sum_total,
       updated_at = now()
  from agg a
 where c.id = a.customer_id;
