-- Create html_snapshots table for storing pre-generated HTML for bots
CREATE TABLE public.html_snapshots (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type TEXT NOT NULL CHECK (content_type IN ('website', 'funnel')),
    content_id UUID NOT NULL,
    custom_domain TEXT,
    html_content TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.html_snapshots ENABLE ROW LEVEL SECURITY;

-- Store owners can manage snapshots for their content
CREATE POLICY "Store owners can manage html snapshots" 
ON public.html_snapshots 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.websites w 
    WHERE w.id = content_id AND content_type = 'website' AND is_store_owner(w.store_id)
  ) OR EXISTS (
    SELECT 1 FROM public.funnels f 
    WHERE f.id = content_id AND content_type = 'funnel' AND is_store_owner(f.store_id)
  )
);

-- Anyone can read snapshots for SEO purposes (bots need access)
CREATE POLICY "Anyone can read html snapshots for SEO" 
ON public.html_snapshots 
FOR SELECT 
USING (true);

-- Add indexes for performance
CREATE INDEX idx_html_snapshots_content ON public.html_snapshots (content_type, content_id);
CREATE INDEX idx_html_snapshots_domain ON public.html_snapshots (custom_domain);
CREATE INDEX idx_html_snapshots_generated ON public.html_snapshots (generated_at DESC);

-- Add seo_keywords columns to support better SEO
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS seo_keywords TEXT[] DEFAULT '{}';
ALTER TABLE public.website_pages ADD COLUMN IF NOT EXISTS seo_keywords TEXT[] DEFAULT '{}';
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS seo_keywords TEXT[] DEFAULT '{}';
ALTER TABLE public.funnel_steps ADD COLUMN IF NOT EXISTS seo_keywords TEXT[] DEFAULT '{}';