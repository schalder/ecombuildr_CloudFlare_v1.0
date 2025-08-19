
-- 1) Prevent deleting a website that still has pages
create or replace function public.prevent_delete_website_if_pages()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  page_count int;
begin
  select count(*) into page_count
  from public.website_pages
  where website_id = old.id;

  if page_count > 0 then
    raise exception 'Cannot delete website: % page(s) still exist. Please delete them first. Deletion is irreversible.', page_count;
  end if;

  return old;
end;
$$;

drop trigger if exists trg_prevent_delete_website_if_pages on public.websites;
create trigger trg_prevent_delete_website_if_pages
before delete on public.websites
for each row
execute function public.prevent_delete_website_if_pages();


-- 2) Cleanup after deleting a website
create or replace function public.cleanup_after_delete_website()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  -- Remove domain connections pointing to this website
  delete from public.domain_connections
  where content_type = 'website' and content_id = old.id;

  -- Remove HTML snapshots referencing this website
  delete from public.html_snapshots
  where content_type = 'website' and content_id = old.id;

  -- Remove analytics records
  delete from public.website_analytics
  where website_id = old.id;

  -- Remove pixel events for this website
  delete from public.pixel_events
  where website_id = old.id;

  -- Remove product/category visibility scoped to this website
  delete from public.product_website_visibility
  where website_id = old.id;

  delete from public.category_website_visibility
  where website_id = old.id;

  return old;
end;
$$;

drop trigger if exists trg_cleanup_after_delete_website on public.websites;
create trigger trg_cleanup_after_delete_website
after delete on public.websites
for each row
execute function public.cleanup_after_delete_website();


-- 3) Cleanup after deleting a website page
create or replace function public.cleanup_after_delete_website_page()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  delete from public.domain_connections
  where content_type = 'website_page' and content_id = old.id;

  delete from public.html_snapshots
  where content_type = 'website_page' and content_id = old.id;

  return old;
end;
$$;

drop trigger if exists trg_cleanup_after_delete_website_page on public.website_pages;
create trigger trg_cleanup_after_delete_website_page
after delete on public.website_pages
for each row
execute function public.cleanup_after_delete_website_page();


-- 4) Prevent deleting a funnel that still has steps
-- Note: Assumes table public.funnel_steps exists with funnel_id FK
create or replace function public.prevent_delete_funnel_if_steps()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  step_count int;
begin
  select count(*) into step_count
  from public.funnel_steps
  where funnel_id = old.id;

  if step_count > 0 then
    raise exception 'Cannot delete funnel: % step(s) still exist. Please delete them first. Deletion is irreversible.', step_count;
  end if;

  return old;
end;
$$;

drop trigger if exists trg_prevent_delete_funnel_if_steps on public.funnels;
create trigger trg_prevent_delete_funnel_if_steps
before delete on public.funnels
for each row
execute function public.prevent_delete_funnel_if_steps();


-- 5) Cleanup after deleting a funnel
create or replace function public.cleanup_after_delete_funnel()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  delete from public.domain_connections
  where content_type = 'funnel' and content_id = old.id;

  delete from public.html_snapshots
  where content_type = 'funnel' and content_id = old.id;

  return old;
end;
$$;

drop trigger if exists trg_cleanup_after_delete_funnel on public.funnels;
create trigger trg_cleanup_after_delete_funnel
after delete on public.funnels
for each row
execute function public.cleanup_after_delete_funnel();


-- 6) Cleanup after deleting a funnel step
-- Note: Assumes table public.funnel_steps exists
create or replace function public.cleanup_after_delete_funnel_step()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  delete from public.domain_connections
  where content_type = 'funnel_step' and content_id = old.id;

  delete from public.html_snapshots
  where content_type = 'funnel_step' and content_id = old.id;

  return old;
end;
$$;

drop trigger if exists trg_cleanup_after_delete_funnel_step on public.funnel_steps;
create trigger trg_cleanup_after_delete_funnel_step
after delete on public.funnel_steps
for each row
execute function public.cleanup_after_delete_funnel_step();
