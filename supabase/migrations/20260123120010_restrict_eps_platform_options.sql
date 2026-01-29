-- Hide EPS credentials from regular authenticated users
drop policy if exists "Authenticated users can view non-ebpay payment options" on public.platform_payment_options;

create policy "Authenticated users can view non-sensitive payment options"
on public.platform_payment_options
for select
to authenticated
using (provider not in ('ebpay', 'eps'));
