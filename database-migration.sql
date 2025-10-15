-- Complete Database Schema Updates Migration
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- 1. Add missing columns to funnel_steps table
-- ============================================
ALTER TABLE public.funnel_steps 
ADD COLUMN IF NOT EXISTS on_success_custom_url text,
ADD COLUMN IF NOT EXISTS on_accept_custom_url text,
ADD COLUMN IF NOT EXISTS on_decline_custom_url text;

COMMENT ON COLUMN public.funnel_steps.on_success_custom_url IS 'Custom redirect URL for successful form submission';
COMMENT ON COLUMN public.funnel_steps.on_accept_custom_url IS 'Custom redirect URL when user accepts';
COMMENT ON COLUMN public.funnel_steps.on_decline_custom_url IS 'Custom redirect URL when user declines';

-- ============================================
-- 2. Create prompt_categories table
-- ============================================
CREATE TABLE IF NOT EXISTS public.prompt_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    icon text,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on prompt_categories
ALTER TABLE public.prompt_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompt_categories (public read access)
CREATE POLICY "Anyone can view prompt categories"
ON public.prompt_categories
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage prompt categories"
ON public.prompt_categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create index for prompt_categories
CREATE INDEX IF NOT EXISTS idx_prompt_categories_slug ON public.prompt_categories(slug);
CREATE INDEX IF NOT EXISTS idx_prompt_categories_display_order ON public.prompt_categories(display_order);

-- ============================================
-- 3. Create prompts table
-- ============================================
CREATE TABLE IF NOT EXISTS public.prompts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid REFERENCES public.prompt_categories(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    content text NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    tags text[] DEFAULT '{}',
    display_order integer NOT NULL DEFAULT 0,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on prompts
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompts (public can view published, authenticated can manage all)
CREATE POLICY "Anyone can view published prompts"
ON public.prompts
FOR SELECT
USING (is_published = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage prompts"
ON public.prompts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create indexes for prompts
CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON public.prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_is_published ON public.prompts(is_published);
CREATE INDEX IF NOT EXISTS idx_prompts_display_order ON public.prompts(display_order);
CREATE INDEX IF NOT EXISTS idx_prompts_created_by ON public.prompts(created_by);

-- Create full-text search index for prompts
CREATE INDEX IF NOT EXISTS idx_prompts_search ON public.prompts 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || content));

-- ============================================
-- 4. Add iframe_embed_code to platform_marketing_content
-- ============================================
ALTER TABLE public.platform_marketing_content 
ADD COLUMN IF NOT EXISTS iframe_embed_code text;

COMMENT ON COLUMN public.platform_marketing_content.iframe_embed_code IS 'Custom iframe embed code for video players (alternative to youtube_url)';

-- ============================================
-- 5. Create updated_at trigger functions (if not exists)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_updated_at_prompt_categories ON public.prompt_categories;
CREATE TRIGGER set_updated_at_prompt_categories
    BEFORE UPDATE ON public.prompt_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_prompts ON public.prompts;
CREATE TRIGGER set_updated_at_prompts
    BEFORE UPDATE ON public.prompts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 6. Insert sample data for prompt categories (optional)
-- ============================================
INSERT INTO public.prompt_categories (name, slug, description, icon, display_order)
VALUES 
    ('Marketing', 'marketing', 'Marketing and advertising prompts', '📢', 1),
    ('Content Writing', 'content-writing', 'Content creation and copywriting prompts', '✍️', 2),
    ('Business', 'business', 'Business strategy and planning prompts', '💼', 3),
    ('Creative', 'creative', 'Creative writing and brainstorming prompts', '🎨', 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Verification queries
-- ============================================
-- Run these to verify the migration was successful:

-- Check funnel_steps columns
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'funnel_steps' 
-- AND column_name IN ('on_success_custom_url', 'on_accept_custom_url', 'on_decline_custom_url');

-- Check prompt_categories table
-- SELECT COUNT(*) FROM public.prompt_categories;

-- Check prompts table
-- SELECT COUNT(*) FROM public.prompts;

-- Check platform_marketing_content
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'platform_marketing_content' AND column_name = 'iframe_embed_code';
