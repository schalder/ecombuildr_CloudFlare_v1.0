-- Create websites table for complete website management
CREATE TABLE public.websites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  domain TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT false,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);

-- Create website_pages table for individual pages within websites
CREATE TABLE public.website_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_homepage BOOLEAN NOT NULL DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  custom_scripts TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(website_id, slug)
);

-- Create funnels table for funnel campaigns
CREATE TABLE public.funnels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  domain TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT false,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);

-- Create funnel_steps table for individual steps within funnels
CREATE TABLE public.funnel_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id UUID NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 1,
  step_type TEXT NOT NULL DEFAULT 'landing', -- landing, checkout, thankyou, etc.
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  custom_scripts TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(funnel_id, slug),
  UNIQUE(funnel_id, step_order)
);

-- Enable RLS on all tables
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_steps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for websites
CREATE POLICY "Store owners can manage websites" 
ON public.websites 
FOR ALL 
USING (is_store_owner(store_id));

CREATE POLICY "Anyone can view published websites" 
ON public.websites 
FOR SELECT 
USING (is_published = true AND is_active = true);

-- Create RLS policies for website_pages
CREATE POLICY "Store owners can manage website pages" 
ON public.website_pages 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.websites 
  WHERE websites.id = website_pages.website_id 
  AND is_store_owner(websites.store_id)
));

CREATE POLICY "Anyone can view published website pages" 
ON public.website_pages 
FOR SELECT 
USING (is_published = true AND EXISTS (
  SELECT 1 FROM public.websites 
  WHERE websites.id = website_pages.website_id 
  AND websites.is_published = true 
  AND websites.is_active = true
));

-- Create RLS policies for funnels
CREATE POLICY "Store owners can manage funnels" 
ON public.funnels 
FOR ALL 
USING (is_store_owner(store_id));

CREATE POLICY "Anyone can view published funnels" 
ON public.funnels 
FOR SELECT 
USING (is_published = true AND is_active = true);

-- Create RLS policies for funnel_steps
CREATE POLICY "Store owners can manage funnel steps" 
ON public.funnel_steps 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.funnels 
  WHERE funnels.id = funnel_steps.funnel_id 
  AND is_store_owner(funnels.store_id)
));

CREATE POLICY "Anyone can view published funnel steps" 
ON public.funnel_steps 
FOR SELECT 
USING (is_published = true AND EXISTS (
  SELECT 1 FROM public.funnels 
  WHERE funnels.id = funnel_steps.funnel_id 
  AND funnels.is_published = true 
  AND funnels.is_active = true
));

-- Create triggers for updated_at columns
CREATE TRIGGER update_websites_updated_at
  BEFORE UPDATE ON public.websites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_website_pages_updated_at
  BEFORE UPDATE ON public.website_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_funnels_updated_at
  BEFORE UPDATE ON public.funnels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_funnel_steps_updated_at
  BEFORE UPDATE ON public.funnel_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to set homepage for website
CREATE OR REPLACE FUNCTION public.set_website_homepage(page_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  target_website_id uuid;
  target_store_id uuid;
BEGIN
  -- Get the website_id and store_id for the target page
  SELECT wp.website_id, w.store_id INTO target_website_id, target_store_id
  FROM public.website_pages wp
  JOIN public.websites w ON w.id = wp.website_id
  WHERE wp.id = page_uuid;
  
  IF target_website_id IS NULL THEN
    RAISE EXCEPTION 'Website page not found';
  END IF;
  
  -- Check if user owns the store
  IF NOT public.is_store_owner(target_store_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Unset all other homepages for this website
  UPDATE public.website_pages
  SET is_homepage = false
  WHERE website_id = target_website_id AND is_homepage = true;
  
  -- Set the target page as homepage
  UPDATE public.website_pages
  SET is_homepage = true
  WHERE id = page_uuid;
END;
$function$;