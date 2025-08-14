-- Create pixel_events table to store Facebook pixel and other tracking events
CREATE TABLE public.pixel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  website_id UUID NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id UUID NULL,
  session_id TEXT NULL,
  page_url TEXT NULL,
  referrer TEXT NULL,
  utm_source TEXT NULL,
  utm_campaign TEXT NULL,
  utm_medium TEXT NULL,
  utm_term TEXT NULL,
  utm_content TEXT NULL,
  fbclid TEXT NULL,
  gclid TEXT NULL,
  user_agent TEXT NULL,
  ip_address TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pixel_events ENABLE ROW LEVEL SECURITY;

-- Create policies for pixel events
CREATE POLICY "Anyone can insert pixel events for tracking" 
ON public.pixel_events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Store owners can view pixel events" 
ON public.pixel_events 
FOR SELECT 
USING (is_store_owner(store_id));

-- Create indexes for better performance
CREATE INDEX idx_pixel_events_store_id ON public.pixel_events(store_id);
CREATE INDEX idx_pixel_events_event_type ON public.pixel_events(event_type);
CREATE INDEX idx_pixel_events_created_at ON public.pixel_events(created_at);
CREATE INDEX idx_pixel_events_store_date ON public.pixel_events(store_id, created_at);