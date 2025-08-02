-- Create theme templates table for predefined theme layouts
CREATE TABLE public.theme_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  preview_image TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create store customizations table for user modifications
CREATE TABLE public.store_customizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  theme_template_id UUID NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_css TEXT,
  custom_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theme_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_customizations ENABLE ROW LEVEL SECURITY;

-- RLS policies for theme_templates
CREATE POLICY "Anyone can view active theme templates" 
ON public.theme_templates 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Super admin can manage theme templates" 
ON public.theme_templates 
FOR ALL 
USING (is_super_admin());

-- RLS policies for store_customizations
CREATE POLICY "Store owners can manage their customizations" 
ON public.store_customizations 
FOR ALL 
USING (is_store_owner(store_id));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_theme_templates_updated_at
BEFORE UPDATE ON public.theme_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_customizations_updated_at
BEFORE UPDATE ON public.store_customizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the two theme templates
INSERT INTO public.theme_templates (name, slug, description, config, sections) VALUES 
(
  'Tech Modern', 
  'tech-modern',
  'Clean, minimalist design perfect for technology and modern businesses',
  '{"colors": {"primary": "#2563eb", "secondary": "#1e40af", "accent": "#3b82f6", "background": "#ffffff", "text": "#1f2937"}, "typography": {"heading": "Inter", "body": "Inter"}, "spacing": "modern", "borderRadius": "minimal"}',
  '[
    {"type": "hero_tech", "content": {"title": "Welcome to the Future", "subtitle": "Discover cutting-edge products that transform your world", "cta": "Explore Products", "background": "gradient", "layout": "center"}},
    {"type": "featured_products", "content": {"title": "Featured Products", "limit": 8, "layout": "grid", "showPrice": true}},
    {"type": "category_showcase", "content": {"title": "Shop by Category", "layout": "grid", "showDescription": true}},
    {"type": "testimonials", "content": {"title": "What Our Customers Say", "layout": "slider"}},
    {"type": "newsletter", "content": {"title": "Stay Updated", "subtitle": "Get the latest updates on new products and offers"}}
  ]'
),
(
  'Fresh Organic', 
  'fresh-organic',
  'Warm, natural design ideal for organic, lifestyle, and wellness brands',
  '{"colors": {"primary": "#059669", "secondary": "#047857", "accent": "#10b981", "background": "#fefefe", "text": "#374151"}, "typography": {"heading": "Playfair Display", "body": "Source Sans Pro"}, "spacing": "organic", "borderRadius": "rounded"}',
  '[
    {"type": "hero_organic", "content": {"title": "Pure. Natural. Fresh.", "subtitle": "Discover organic products that nurture your well-being", "cta": "Shop Natural", "background": "image", "layout": "left"}},
    {"type": "featured_products", "content": {"title": "Best Sellers", "limit": 6, "layout": "organic", "showPrice": true}},
    {"type": "values_section", "content": {"title": "Our Values", "items": [{"title": "100% Organic", "description": "Certified organic ingredients"}, {"title": "Eco-Friendly", "description": "Sustainable packaging"}, {"title": "Fair Trade", "description": "Supporting farmers worldwide"}]}},
    {"type": "category_showcase", "content": {"title": "Shop by Category", "layout": "organic", "showDescription": true}},
    {"type": "newsletter", "content": {"title": "Join Our Community", "subtitle": "Get exclusive access to new products and wellness tips"}}
  ]'
);