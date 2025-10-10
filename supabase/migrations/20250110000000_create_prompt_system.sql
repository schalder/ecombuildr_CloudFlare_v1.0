-- Prompt Categories Table
CREATE TABLE IF NOT EXISTS public.prompt_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prompts Table
CREATE TABLE IF NOT EXISTS public.prompts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid REFERENCES public.prompt_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  content text NOT NULL,
  is_published boolean DEFAULT false,
  tags text[],
  display_order integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Categories
CREATE POLICY "Anyone can view published categories"
  ON public.prompt_categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage categories"
  ON public.prompt_categories FOR ALL
  USING (auth.jwt()->>'is_super_admin' = 'true');

-- RLS Policies for Prompts
CREATE POLICY "Anyone can view published prompts"
  ON public.prompts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Only admins can manage prompts"
  ON public.prompts FOR ALL
  USING (auth.jwt()->>'is_super_admin' = 'true');

-- Indexes
CREATE INDEX idx_prompts_category ON public.prompts(category_id);
CREATE INDEX idx_prompts_published ON public.prompts(is_published);
CREATE INDEX idx_categories_slug ON public.prompt_categories(slug);

-- Insert default categories
INSERT INTO public.prompt_categories (name, slug, description, icon, display_order) VALUES
('Landing Pages', 'landing-pages', 'Prompts for creating high-converting landing pages', 'Globe', 1),
('Email Marketing', 'email-marketing', 'Email copy and campaign prompts', 'Mail', 2),
('Social Media', 'social-media', 'Social media posts and content prompts', 'Share2', 3),
('Ad Copy', 'ad-copy', 'Advertising copy for various platforms', 'Megaphone', 4),
('Product Descriptions', 'product-descriptions', 'Compelling product description prompts', 'Package', 5),
('Blog Content', 'blog-content', 'Blog post and article writing prompts', 'FileText', 6)
ON CONFLICT (slug) DO NOTHING;
