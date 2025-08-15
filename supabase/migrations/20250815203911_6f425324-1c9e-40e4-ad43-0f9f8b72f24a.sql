-- Allow super admin to view all profiles for admin functionality
CREATE POLICY "Super admin can view all profiles for admin" ON public.profiles
FOR SELECT 
USING (is_super_admin());