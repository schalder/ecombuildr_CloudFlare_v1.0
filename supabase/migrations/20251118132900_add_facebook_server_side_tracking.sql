-- Add Facebook server-side tracking columns to websites table
ALTER TABLE public.websites 
ADD COLUMN IF NOT EXISTS facebook_access_token TEXT,
ADD COLUMN IF NOT EXISTS facebook_test_event_code TEXT,
ADD COLUMN IF NOT EXISTS facebook_server_side_enabled BOOLEAN DEFAULT false;

-- Add funnel_id column to pixel_events if it doesn't exist (for funnel tracking)
ALTER TABLE public.pixel_events 
ADD COLUMN IF NOT EXISTS funnel_id UUID REFERENCES public.funnels(id) ON DELETE SET NULL;

-- Create index for funnel_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_pixel_events_funnel_id ON public.pixel_events(funnel_id);

-- Add comment to explain the columns
COMMENT ON COLUMN public.websites.facebook_access_token IS 'Facebook Access Token for Conversions API server-side tracking';
COMMENT ON COLUMN public.websites.facebook_test_event_code IS 'Facebook Test Event Code for testing server-side events';
COMMENT ON COLUMN public.websites.facebook_server_side_enabled IS 'Enable/disable Facebook server-side event forwarding';

-- Create table to track Facebook event forwarding failures (optional, for debugging)
CREATE TABLE IF NOT EXISTS public.facebook_event_failures (
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

-- Enable RLS on facebook_event_failures table
ALTER TABLE public.facebook_event_failures ENABLE ROW LEVEL SECURITY;

-- Create policy for store owners to view their own event failures
CREATE POLICY "Store owners can view their facebook event failures" 
ON public.facebook_event_failures 
FOR SELECT 
USING (is_store_owner(store_id));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_facebook_event_failures_store_id ON public.facebook_event_failures(store_id);
CREATE INDEX IF NOT EXISTS idx_facebook_event_failures_pixel_event_id ON public.facebook_event_failures(pixel_event_id);
CREATE INDEX IF NOT EXISTS idx_facebook_event_failures_created_at ON public.facebook_event_failures(created_at);

-- Enable pg_net extension for HTTP requests from database functions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to forward pixel event to Facebook Conversions API via Edge Function
CREATE OR REPLACE FUNCTION public.forward_pixel_event_to_facebook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  pixel_config RECORD;
  website_config RECORD;
  funnel_config RECORD;
  pixel_id TEXT;
  access_token TEXT;
  test_event_code TEXT;
  server_side_enabled BOOLEAN;
  event_id TEXT;
  user_email TEXT;
  user_phone TEXT;
  user_name TEXT;
  request_payload JSONB;
  supabase_url TEXT := 'https://fhqwacmokbtbspkxjixf.supabase.co';
  edge_function_url TEXT;
BEGIN
  -- Only process if Facebook is configured
  IF NOT (NEW.event_data->'_providers'->'facebook'->>'configured' = 'true') THEN
    RETURN NEW;
  END IF;

  -- Try to get configuration from website first
  IF NEW.website_id IS NOT NULL THEN
    SELECT 
      w.facebook_pixel_id,
      w.facebook_access_token,
      w.facebook_test_event_code,
      w.facebook_server_side_enabled
    INTO website_config
    FROM public.websites w
    WHERE w.id = NEW.website_id;

    IF website_config.facebook_server_side_enabled = true 
       AND website_config.facebook_pixel_id IS NOT NULL 
       AND website_config.facebook_access_token IS NOT NULL THEN
      pixel_id := website_config.facebook_pixel_id;
      access_token := website_config.facebook_access_token;
      test_event_code := website_config.facebook_test_event_code;
      server_side_enabled := true;
    END IF;
  END IF;

  -- If not found from website, try funnel
  IF server_side_enabled IS NULL AND NEW.funnel_id IS NOT NULL THEN
    SELECT 
      f.settings->>'facebook_pixel_id' as facebook_pixel_id,
      f.settings->>'facebook_access_token' as facebook_access_token,
      f.settings->>'facebook_test_event_code' as facebook_test_event_code,
      COALESCE((f.settings->>'facebook_server_side_enabled')::boolean, false) as facebook_server_side_enabled
    INTO funnel_config
    FROM public.funnels f
    WHERE f.id = NEW.funnel_id;

    IF funnel_config.facebook_server_side_enabled = true 
       AND funnel_config.facebook_pixel_id IS NOT NULL 
       AND funnel_config.facebook_access_token IS NOT NULL THEN
      pixel_id := funnel_config.facebook_pixel_id;
      access_token := funnel_config.facebook_access_token;
      test_event_code := funnel_config.facebook_test_event_code;
      server_side_enabled := true;
    END IF;
  END IF;

  -- If server-side tracking is not enabled or config not found, skip
  IF server_side_enabled IS NOT TRUE OR pixel_id IS NULL OR access_token IS NULL THEN
    RETURN NEW;
  END IF;

  -- Extract user data from event_data or order if available
  user_email := COALESCE(
    NEW.event_data->>'customer_email',
    NEW.event_data->>'email'
  );
  user_phone := COALESCE(
    NEW.event_data->>'customer_phone',
    NEW.event_data->>'phone'
  );
  user_name := NEW.event_data->>'customer_name';

  -- Generate event_id for deduplication (use pixel_event id if available)
  event_id := COALESCE(
    NEW.event_data->>'event_id',
    NEW.id::TEXT
  );

  -- Build request payload
  request_payload := jsonb_build_object(
    'pixel_id', pixel_id,
    'access_token', access_token,
    'event_name', NEW.event_type,
    'event_data', NEW.event_data,
    'user_data', jsonb_build_object(
      'email', user_email,
      'phone', user_phone,
      'firstName', CASE 
        WHEN user_name IS NOT NULL THEN split_part(user_name, ' ', 1)
        ELSE NULL
      END,
      'lastName', CASE 
        WHEN user_name IS NOT NULL AND position(' ' in user_name) > 0 
        THEN substring(user_name from position(' ' in user_name) + 1)
        ELSE NULL
      END,
      'city', NEW.event_data->>'shipping_city',
      'state', NEW.event_data->>'shipping_state',
      'zipCode', NEW.event_data->>'shipping_postal_code',
      'country', NEW.event_data->>'shipping_country'
    ),
    'event_id', event_id,
    'event_time', EXTRACT(EPOCH FROM NEW.created_at)::INT,
    'test_event_code', NULLIF(test_event_code, '')
  );

  -- Call Edge Function via HTTP using pg_net extension
  -- Get Supabase URL (using known project URL)
  BEGIN
    edge_function_url := supabase_url || '/functions/v1/send-facebook-event';
    
    -- Call Edge Function asynchronously using pg_net
    -- This is fire-and-forget to avoid blocking the insert
    -- Note: pg_net.http_post is asynchronous, so it won't block
    PERFORM net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := request_payload::text
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      -- If HTTP call fails, log error but don't fail the insert
      INSERT INTO public.facebook_event_failures (
        pixel_event_id,
        store_id,
        website_id,
        funnel_id,
        event_type,
        error_message,
        error_code
      ) VALUES (
        NEW.id,
        NEW.store_id,
        NEW.website_id,
        NEW.funnel_id,
        NEW.event_type,
        'HTTP call failed: ' || SQLERRM,
        SQLSTATE
      );
  END;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    INSERT INTO public.facebook_event_failures (
      pixel_event_id,
      store_id,
      website_id,
      funnel_id,
      event_type,
      error_message,
      error_code
    ) VALUES (
      NEW.id,
      NEW.store_id,
      NEW.website_id,
      NEW.funnel_id,
      NEW.event_type,
      SQLERRM,
      SQLSTATE
    );
    RETURN NEW;
END;
$$;

-- Create trigger to forward events
CREATE TRIGGER forward_facebook_events_trigger
AFTER INSERT ON public.pixel_events
FOR EACH ROW
EXECUTE FUNCTION public.forward_pixel_event_to_facebook();

