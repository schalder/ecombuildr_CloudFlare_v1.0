-- Add additional SEO fields to pages table
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS seo_keywords text[];
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS meta_author text;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS canonical_url text;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS custom_meta_tags jsonb DEFAULT '{}';
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS social_image_url text;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS language_code text DEFAULT 'en';
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS meta_robots text DEFAULT 'index,follow';

-- Add additional SEO fields to website_pages table
ALTER TABLE public.website_pages ADD COLUMN IF NOT EXISTS seo_keywords text[];
ALTER TABLE public.website_pages ADD COLUMN IF NOT EXISTS meta_author text;
ALTER TABLE public.website_pages ADD COLUMN IF NOT EXISTS canonical_url text;
ALTER TABLE public.website_pages ADD COLUMN IF NOT EXISTS custom_meta_tags jsonb DEFAULT '{}';
ALTER TABLE public.website_pages ADD COLUMN IF NOT EXISTS social_image_url text;
ALTER TABLE public.website_pages ADD COLUMN IF NOT EXISTS language_code text DEFAULT 'en';
ALTER TABLE public.website_pages ADD COLUMN IF NOT EXISTS meta_robots text DEFAULT 'index,follow';

-- Add additional SEO fields to funnel_steps table
ALTER TABLE public.funnel_steps ADD COLUMN IF NOT EXISTS seo_keywords text[];
ALTER TABLE public.funnel_steps ADD COLUMN IF NOT EXISTS meta_author text;
ALTER TABLE public.funnel_steps ADD COLUMN IF NOT EXISTS canonical_url text;
ALTER TABLE public.funnel_steps ADD COLUMN IF NOT EXISTS custom_meta_tags jsonb DEFAULT '{}';
ALTER TABLE public.funnel_steps ADD COLUMN IF NOT EXISTS social_image_url text;
ALTER TABLE public.funnel_steps ADD COLUMN IF NOT EXISTS language_code text DEFAULT 'en';
ALTER TABLE public.funnel_steps ADD COLUMN IF NOT EXISTS meta_robots text DEFAULT 'index,follow';