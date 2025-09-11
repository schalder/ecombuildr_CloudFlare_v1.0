-- Create admin function to delete funnel and all related data
CREATE OR REPLACE FUNCTION public.delete_funnel_admin(p_funnel_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only super admins can call this function
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: super admin required';
  END IF;

  -- Delete all related data in correct order to avoid foreign key constraints
  
  -- Delete funnel step related data
  DELETE FROM public.html_snapshots 
  WHERE content_type = 'funnel_step' 
    AND content_id IN (
      SELECT id FROM public.funnel_steps WHERE funnel_id = p_funnel_id
    );

  DELETE FROM public.domain_connections 
  WHERE content_type = 'funnel_step' 
    AND content_id IN (
      SELECT id FROM public.funnel_steps WHERE funnel_id = p_funnel_id
    );

  -- Delete funnel steps
  DELETE FROM public.funnel_steps WHERE funnel_id = p_funnel_id;

  -- Delete domain connections pointing to this funnel
  DELETE FROM public.domain_connections 
  WHERE content_type = 'funnel' AND content_id = p_funnel_id;

  -- Delete HTML snapshots for this funnel
  DELETE FROM public.html_snapshots 
  WHERE content_type = 'funnel' AND content_id = p_funnel_id;

  -- Finally delete the funnel itself
  DELETE FROM public.funnels WHERE id = p_funnel_id;
END;
$function$;