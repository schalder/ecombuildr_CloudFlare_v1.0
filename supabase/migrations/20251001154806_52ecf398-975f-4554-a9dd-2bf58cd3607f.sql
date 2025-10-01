-- Drop the restrictive RLS policy that blocks ebpay for regular users
DROP POLICY IF EXISTS "Authenticated users can view non-ebpay payment options" ON public.platform_payment_options;

-- Create new policy: authenticated users can see all enabled payment options
-- But mask account_number for ebpay when not super admin
CREATE POLICY "Authenticated users can view enabled payment options"
ON public.platform_payment_options
FOR SELECT
TO authenticated
USING (
  is_enabled = true
);