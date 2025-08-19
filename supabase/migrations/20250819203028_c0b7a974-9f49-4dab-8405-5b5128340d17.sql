-- Fix RLS policies for customers table to prevent unauthorized access
-- Drop existing policies
DROP POLICY IF EXISTS "Store owners can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Store owners can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Store owners can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Store owners can select customers" ON public.customers;
DROP POLICY IF EXISTS "Store owners can update customers" ON public.customers;
DROP POLICY IF EXISTS "Super admin can view all customers for reporting" ON public.customers;

-- Create secure RLS policies that require authentication
CREATE POLICY "Store owners can view their customers" 
ON public.customers 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND is_store_owner(store_id)
);

CREATE POLICY "Store owners can insert customers to their stores" 
ON public.customers 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND is_store_owner(store_id)
);

CREATE POLICY "Store owners can update their customers" 
ON public.customers 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND is_store_owner(store_id)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND is_store_owner(store_id)
);

CREATE POLICY "Store owners can delete their customers" 
ON public.customers 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND is_store_owner(store_id)
);

CREATE POLICY "Super admin can view all customers for reporting" 
ON public.customers 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND is_super_admin()
);

-- Ensure RLS is enabled (should already be enabled but making sure)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;