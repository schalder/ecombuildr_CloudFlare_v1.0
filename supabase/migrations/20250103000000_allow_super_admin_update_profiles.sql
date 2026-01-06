-- Allow super admin to update all profiles for admin functionality
CREATE POLICY "Super admin can update all profiles for admin" ON public.profiles
FOR UPDATE 
USING (is_super_admin())
WITH CHECK (is_super_admin());


