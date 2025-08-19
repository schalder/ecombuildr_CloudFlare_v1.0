
-- Secure summary of orders per library product for Admin
create or replace function public.get_library_orders_summary()
returns table (
  library_item_id uuid,
  product_name text,
  total_orders integer,
  total_quantity integer,
  revenue numeric,
  last_order_at timestamp with time zone
)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- Only Super Admins
  if not public.is_super_admin() then
    raise exception 'Access denied';
  end if;

  return query
  select
    pli.library_item_id,
    pl.name as product_name,
    count(distinct o.id)::int as total_orders,
    coalesce(sum(oi.quantity), 0)::int as total_quantity,
    coalesce(sum(oi.quantity * oi.price), 0) as revenue,
    max(o.created_at) as last_order_at
  from public.product_library_imports pli
  join public.products p on p.id = pli.product_id
  join public.product_library pl on pl.id = pli.library_item_id
  join public.order_items oi on oi.product_id = p.id
  join public.orders o on o.id = oi.order_id
  where o.status::text <> 'cancelled'
  group by pli.library_item_id, pl.name
  order by revenue desc, total_orders desc;
end;
$function$;
