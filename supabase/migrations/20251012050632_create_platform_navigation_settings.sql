-- Create platform_navigation_settings table
CREATE TABLE public.platform_navigation_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url text,
  nav_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_navigation_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view navigation settings (for public website)
CREATE POLICY "Anyone can view navigation settings" 
ON public.platform_navigation_settings 
FOR SELECT 
USING (true);

-- Only super admins can manage navigation settings
CREATE POLICY "Super admin can manage navigation settings" 
ON public.platform_navigation_settings 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_platform_navigation_settings_updated_at
BEFORE UPDATE ON public.platform_navigation_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default navigation settings
INSERT INTO public.platform_navigation_settings (logo_url, nav_items)
VALUES (
  'https://res.cloudinary.com/funnelsninja/image/upload/v1755206321/ecombuildr-logo-big_vifrmg.png',
  '[
    {"id": "features", "label": "Features", "href": "/#tools", "enabled": true, "children": []},
    {"id": "templates", "label": "Templates", "href": "/templates", "enabled": true, "children": []},
    {"id": "pricing", "label": "Pricing", "href": "/#pricing", "enabled": true, "children": []},
    {"id": "testimonials", "label": "Success Stories", "href": "/#testimonials", "enabled": true, "children": []},
    {"id": "ebpay", "label": "EB Pay", "href": "https://pay.ecombuildr.com/", "external": true, "enabled": true, "children": []},
    {"id": "faq", "label": "FAQ", "href": "/#support", "enabled": true, "children": []}
  ]'::jsonb
);
