-- Create table to track TikTok event forwarding failures (similar to Facebook)
CREATE TABLE IF NOT EXISTS public.tiktok_event_failures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pixel_event_id UUID REFERENCES public.pixel_events(id) ON DELETE CASCADE,
  store_id UUID NOT NULL,
  website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE,
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  error_message TEXT,
  error_code TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tiktok_event_failures ENABLE ROW LEVEL SECURITY;

-- Create policy for store owners
CREATE POLICY "Store owners can view their tiktok event failures" 
ON public.tiktok_event_failures 
FOR SELECT 
USING (is_store_owner(store_id));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tiktok_event_failures_store_id ON public.tiktok_event_failures(store_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_event_failures_pixel_event_id ON public.tiktok_event_failures(pixel_event_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_event_failures_created_at ON public.tiktok_event_failures(created_at);
