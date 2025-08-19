-- Create page_templates table for storing reusable page designs
CREATE TABLE public.page_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  template_type TEXT NOT NULL CHECK (template_type IN ('website_page', 'funnel_step')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_image TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view published templates
CREATE POLICY "Anyone can view published templates" 
ON public.page_templates 
FOR SELECT 
USING (is_published = true);

-- Super admin can manage all templates
CREATE POLICY "Super admin can manage templates" 
ON public.page_templates 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Add updated_at trigger
CREATE TRIGGER update_page_templates_updated_at
BEFORE UPDATE ON public.page_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();