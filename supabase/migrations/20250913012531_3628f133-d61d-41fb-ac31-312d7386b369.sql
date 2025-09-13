-- Create function to clean up old pixel events (older than specified days)
CREATE OR REPLACE FUNCTION public.cleanup_old_pixel_events(retention_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  deleted_count INTEGER;
  cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate cutoff date
  cutoff_date := now() - make_interval(days => retention_days);
  
  -- Delete old pixel events
  DELETE FROM public.pixel_events 
  WHERE created_at < cutoff_date;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup operation
  INSERT INTO public.system_logs (operation, details, created_at)
  VALUES (
    'pixel_events_cleanup',
    jsonb_build_object(
      'deleted_count', deleted_count,
      'retention_days', retention_days,
      'cutoff_date', cutoff_date
    ),
    now()
  )
  ON CONFLICT DO NOTHING; -- In case system_logs table doesn't exist yet
  
  RETURN deleted_count;
END;
$function$;

-- Create system logs table for tracking cleanup operations (if not exists)
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on system_logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view system logs
CREATE POLICY "Super admin can view system logs" 
ON public.system_logs 
FOR SELECT 
USING (is_super_admin());

-- Schedule daily cleanup of pixel events older than 90 days at 3 AM
SELECT cron.schedule(
  'cleanup-old-pixel-events',
  '0 3 * * *', -- Daily at 3 AM
  $$
  SELECT public.cleanup_old_pixel_events(90);
  $$
);