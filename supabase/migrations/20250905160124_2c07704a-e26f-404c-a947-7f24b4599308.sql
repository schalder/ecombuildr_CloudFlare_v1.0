-- Add super admin RLS policies for websites and funnels
-- Safe to re-run: drop if exists before create

DROP POLICY IF EXISTS "Super admin can view all websites" ON public.websites;
CREATE POLICY "Super admin can view all websites"
  ON public.websites
  FOR SELECT
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin can manage websites" ON public.websites;
CREATE POLICY "Super admin can manage websites"
  ON public.websites
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin can view all funnels" ON public.funnels;
CREATE POLICY "Super admin can view all funnels"
  ON public.funnels
  FOR SELECT
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin can manage funnels" ON public.funnels;
CREATE POLICY "Super admin can manage funnels"
  ON public.funnels
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());