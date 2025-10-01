-- Update RLS on platform_payment_options to restrict EB Pay access to super admins only
DROP POLICY IF EXISTS "Authenticated users can view payment options" ON public.platform_payment_options;
DROP POLICY IF EXISTS "Super admin can manage payment options" ON public.platform_payment_options;

-- Allow super admins full access to all payment options
CREATE POLICY "Super admin can manage all payment options"
ON public.platform_payment_options
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Allow regular authenticated users to view only non-sensitive payment options (bkash, nagad, etc.)
-- EB Pay credentials are restricted to super admins only
CREATE POLICY "Authenticated users can view non-ebpay payment options"
ON public.platform_payment_options
FOR SELECT
TO authenticated
USING (provider != 'ebpay');