-- Add pixel tracking fields to stores and websites tables
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS facebook_pixel_id text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS google_analytics_id text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS google_ads_id text;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS facebook_pixel_id text;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS google_analytics_id text;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS google_ads_id text;

-- Add pixel event tracking table
CREATE TABLE IF NOT EXISTS public.pixel_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL,
  website_id uuid,
  event_type text NOT NULL,
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid,
  session_id text,
  page_url text,
  referrer text,
  utm_source text,
  utm_campaign text,
  utm_medium text,
  utm_term text,
  utm_content text,
  fbclid text,
  gclid text,
  user_agent text,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for pixel_events
ALTER TABLE public.pixel_events ENABLE ROW LEVEL SECURITY;

-- Create policies for pixel_events
CREATE POLICY "Store owners can view pixel events" 
ON public.pixel_events 
FOR SELECT 
USING (is_store_owner(store_id));

CREATE POLICY "Anyone can insert pixel events for tracking" 
ON public.pixel_events 
FOR INSERT 
WITH CHECK (true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_pixel_events_store_id ON public.pixel_events(store_id);
CREATE INDEX IF NOT EXISTS idx_pixel_events_website_id ON public.pixel_events(website_id);
CREATE INDEX IF NOT EXISTS idx_pixel_events_created_at ON public.pixel_events(created_at);
CREATE INDEX IF NOT EXISTS idx_pixel_events_event_type ON public.pixel_events(event_type);

-- Add facebook_pixel_data to existing orders if not exists
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS facebook_pixel_data jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS google_ads_data jsonb;