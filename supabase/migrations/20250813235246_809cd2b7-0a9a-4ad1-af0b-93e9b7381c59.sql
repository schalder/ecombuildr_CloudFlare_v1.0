-- Create website analytics table for tracking page views and visitor data
CREATE TABLE public.website_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID NOT NULL,
  page_id UUID NULL, -- NULL for website-level analytics, specific page_id for page-level
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  page_views INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  bounce_rate NUMERIC(5,2) DEFAULT 0, -- percentage
  avg_session_duration INTEGER DEFAULT 0, -- seconds
  referrer_source TEXT,
  device_type TEXT DEFAULT 'desktop',
  browser TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Composite unique constraint to prevent duplicates
  UNIQUE(website_id, page_id, date, referrer_source, device_type)
);

-- Enable RLS
ALTER TABLE public.website_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for website analytics
CREATE POLICY "Store owners can view website analytics" 
ON public.website_analytics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.websites w 
    WHERE w.id = website_analytics.website_id 
    AND is_store_owner(w.store_id)
  )
);

CREATE POLICY "Store owners can insert website analytics" 
ON public.website_analytics 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.websites w 
    WHERE w.id = website_analytics.website_id 
    AND is_store_owner(w.store_id)
  )
);

CREATE POLICY "Store owners can update website analytics" 
ON public.website_analytics 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.websites w 
    WHERE w.id = website_analytics.website_id 
    AND is_store_owner(w.store_id)
  )
);

-- Create indexes for better performance
CREATE INDEX idx_website_analytics_website_date ON public.website_analytics(website_id, date DESC);
CREATE INDEX idx_website_analytics_page_date ON public.website_analytics(page_id, date DESC) WHERE page_id IS NOT NULL;

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_website_analytics_updated_at
BEFORE UPDATE ON public.website_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO public.website_analytics (website_id, date, page_views, unique_visitors, bounce_rate, avg_session_duration, referrer_source, device_type)
SELECT 
  w.id,
  CURRENT_DATE - INTERVAL '7 days' + (gs.i || ' days')::INTERVAL,
  FLOOR(RANDOM() * 100 + 10)::INTEGER, -- 10-110 page views
  FLOOR(RANDOM() * 50 + 5)::INTEGER,   -- 5-55 unique visitors  
  ROUND((RANDOM() * 60 + 20)::NUMERIC, 2), -- 20-80% bounce rate
  FLOOR(RANDOM() * 300 + 60)::INTEGER, -- 60-360 seconds session duration
  CASE FLOOR(RANDOM() * 4)::INTEGER
    WHEN 0 THEN 'direct'
    WHEN 1 THEN 'google'
    WHEN 2 THEN 'facebook'
    ELSE 'referral'
  END,
  CASE FLOOR(RANDOM() * 3)::INTEGER
    WHEN 0 THEN 'desktop'
    WHEN 1 THEN 'mobile'
    ELSE 'tablet'
  END
FROM public.websites w
CROSS JOIN generate_series(0, 6) AS gs(i)
WHERE w.is_active = true
LIMIT 50;