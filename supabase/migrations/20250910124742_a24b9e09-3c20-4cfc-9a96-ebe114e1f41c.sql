-- Create site_templates table for marketing templates
CREATE TABLE public.site_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  demo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.site_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active site templates" 
ON public.site_templates 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Super admin can manage site templates" 
ON public.site_templates 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_site_templates_updated_at
BEFORE UPDATE ON public.site_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();