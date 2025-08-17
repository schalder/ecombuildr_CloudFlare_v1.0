-- Create table for managing site pricing plans
CREATE TABLE public.site_pricing_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  display_name_en TEXT,
  price_bdt NUMERIC NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT 'month',
  description TEXT,
  description_en TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  features_en JSONB NOT NULL DEFAULT '[]'::jsonb,
  icon TEXT DEFAULT 'Crown',
  color_class TEXT DEFAULT 'text-primary',
  button_variant TEXT DEFAULT 'default',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_pricing_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active pricing plans" 
ON public.site_pricing_plans 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Super admin can manage pricing plans" 
ON public.site_pricing_plans 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Insert default pricing plans to match current design
INSERT INTO public.site_pricing_plans (plan_name, display_name, display_name_en, price_bdt, description, description_en, features, features_en, is_popular, icon, color_class, button_variant, sort_order)
VALUES 
(
  'free',
  'Starter',
  'Starter',
  0,
  'নতুন ব্যবসায়ীদের জন্য',
  'Perfect for new entrepreneurs',
  '[
    "১টি স্টোর",
    "১০০টি প্রোডাক্ট", 
    "বেসিক ল্যান্ডিং পেজ",
    "COD সাপোর্ট",
    "Email সাপোর্ট",
    "৭ দিন ফ্রি ট্রায়াল"
  ]'::jsonb,
  '[
    "1 Store",
    "100 Products",
    "Basic Landing Page", 
    "COD Support",
    "Email Support",
    "7 Days Free Trial"
  ]'::jsonb,
  false,
  'Zap',
  'text-muted-foreground',
  'outline',
  1
),
(
  'basic',
  'Professional', 
  'Professional',
  1999,
  'গ্রোয়িং ব্যবসার জন্য',
  'For growing businesses',
  '[
    "৫টি স্টোর",
    "আনলিমিটেড প্রোডাক্ট",
    "Advanced Page Builder",
    "সব Payment Methods", 
    "Facebook Pixel & CAPI",
    "Courier Integration",
    "Product Library Access",
    "Priority Support",
    "Custom Domain"
  ]'::jsonb,
  '[
    "5 Stores",
    "Unlimited Products",
    "Advanced Page Builder",
    "All Payment Methods",
    "Facebook Pixel & CAPI", 
    "Courier Integration",
    "Product Library Access",
    "Priority Support",
    "Custom Domain"
  ]'::jsonb,
  true,
  'Crown',
  'text-accent',
  'accent',
  2
),
(
  'pro', 
  'Enterprise',
  'Enterprise',
  4999,
  'বড় ব্যবসায়িক প্রতিষ্ঠানের জন্য',
  'For large business organizations',
  '[
    "আনলিমিটেড স্টোর",
    "আনলিমিটেড প্রোডাক্ট",
    "White-label Solution",
    "Advanced Analytics",
    "API Access", 
    "Custom Integrations",
    "Dedicated Manager",
    "24/7 Phone Support",
    "Multi-location Shipping"
  ]'::jsonb,
  '[
    "Unlimited Stores",
    "Unlimited Products", 
    "White-label Solution",
    "Advanced Analytics",
    "API Access",
    "Custom Integrations",
    "Dedicated Manager", 
    "24/7 Phone Support",
    "Multi-location Shipping"
  ]'::jsonb,
  false,
  'Rocket',
  'text-primary',
  'premium',
  3
);

-- Create trigger for updated_at
CREATE TRIGGER update_site_pricing_plans_updated_at
BEFORE UPDATE ON public.site_pricing_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();