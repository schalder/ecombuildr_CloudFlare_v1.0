-- Create SEO pages table for managing page-level SEO
CREATE TABLE public.seo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  og_image text,
  keywords text[],
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active SEO pages" 
ON public.seo_pages 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Super admin can manage SEO pages" 
ON public.seo_pages 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Insert default SEO data for main pages
INSERT INTO public.seo_pages (page_slug, title, description, keywords) VALUES
('/', 'EcomBuildr - Build Your E-commerce Empire in Minutes', 'Create professional e-commerce stores with our no-code platform. Build websites, funnels, and conversion systems that turn visitors into customers.', ARRAY['ecommerce builder', 'online store', 'no code', 'bangladesh ecommerce']),
('features', 'Features - EcomBuildr E-commerce Platform', 'Discover powerful features to build and grow your online business. Drag-drop builder, payment integration, analytics and more.', ARRAY['ecommerce features', 'online store builder', 'website builder']),
('pricing', 'Pricing Plans - EcomBuildr Bangladesh', 'Affordable pricing plans for every business size. Start your free trial today and build your e-commerce empire.', ARRAY['ecommerce pricing', 'store builder cost', 'business plans bangladesh']),
('auth', 'Sign In - EcomBuildr Dashboard', 'Access your EcomBuildr dashboard to manage your online stores, products, and sales analytics.', ARRAY['login', 'dashboard', 'account access']);

-- Create trigger for updated_at
CREATE TRIGGER update_seo_pages_updated_at
BEFORE UPDATE ON public.seo_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();