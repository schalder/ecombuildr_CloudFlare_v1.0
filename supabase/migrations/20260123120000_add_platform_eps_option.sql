-- Add EPS as a platform payment option (safe if re-run)
insert into public.platform_payment_options
  (provider, display_name, is_enabled, account_number, instructions)
values
  ('eps', 'EPS', false, null, null)
on conflict (provider) do nothing;
