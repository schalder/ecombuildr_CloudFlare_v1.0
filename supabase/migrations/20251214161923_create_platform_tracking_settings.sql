-- Create platform_tracking_settings table for platform-level tracking configuration
CREATE TABLE public.platform_tracking_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facebook_pixel_id text,
  google_analytics_id text,
  google_ads_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_tracking_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view tracking settings (for public website)
CREATE POLICY "Anyone can view tracking settings" 
ON public.platform_tracking_settings 
FOR SELECT 
USING (true);

-- Only super admins can manage tracking settings
CREATE POLICY "Super admin can manage tracking settings" 
ON public.platform_tracking_settings 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_platform_tracking_settings_updated_at
BEFORE UPDATE ON public.platform_tracking_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default row (single row table)
INSERT INTO public.platform_tracking_settings (facebook_pixel_id, google_analytics_id, google_ads_id)
VALUES (NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

