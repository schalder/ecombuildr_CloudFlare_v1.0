-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- Create or replace trigger function to create member account and grant access when a course order completes
create or replace function public.create_member_account_for_course_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  member_account_record public.member_accounts%rowtype;
  generated_password text;
begin
  -- Only act on first transition to completed
  if tg_op = 'UPDATE'
     and new.payment_status = 'completed'
     and (old.payment_status is distinct from 'completed') then

    -- Generate an 8-char password
    generated_password := substring(md5(random()::text) from 1 for 8);

    -- Create or update member account for this store/email
    insert into public.member_accounts (
      store_id, email, password_hash, full_name, phone
    ) values (
      new.store_id,
      new.customer_email,
      crypt(generated_password, gen_salt('bf')),
      new.customer_name,
      new.customer_phone
    )
    on conflict (store_id, email)
    do update set
      full_name = coalesce(public.member_accounts.full_name, excluded.full_name),
      phone     = coalesce(public.member_accounts.phone, excluded.phone),
      updated_at = now()
    returning * into member_account_record;

    -- Grant access to the purchased course
    insert into public.course_member_access (
      member_account_id, course_id, course_order_id, is_active, access_status
    ) values (
      member_account_record.id, new.course_id, new.id, true, 'active'
    )
    on conflict (member_account_id, course_id) do update set
      is_active = true,
      updated_at = now();

    -- Store the plaintext password in order metadata so we can show it once in the confirmation page
    update public.course_orders
    set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('member_password', generated_password),
        updated_at = now()
    where id = new.id;
  end if;

  return new;
end;
$$;

-- Recreate trigger on course_orders
drop trigger if exists trg_course_order_completed on public.course_orders;
create trigger trg_course_order_completed
after update on public.course_orders
for each row
execute function public.create_member_account_for_course_order();