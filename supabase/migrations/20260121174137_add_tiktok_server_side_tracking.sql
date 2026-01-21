-- Create TikTok server-side tracking trigger function
-- Similar to Facebook trigger but TikTok-specific

CREATE OR REPLACE FUNCTION public.forward_pixel_event_to_tiktok()
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
  -- Browser context variables (for TikTok matching)
  ttclid TEXT;
  client_user_agent TEXT;
  event_source_url TEXT;
  request_payload JSONB;
  supabase_url TEXT := 'https://fhqwacmokbtbspkxjixf.supabase.co';
  edge_function_url TEXT;
BEGIN
  -- Check server-side configuration directly from database
  -- Don't check _providers.tiktok.configured (that's client-side only)
  -- Server-side events should fire independently of browser pixel status

  -- Try to get configuration from website first
  IF NEW.website_id IS NOT NULL THEN
    SELECT 
      w.tiktok_pixel_id,
      w.tiktok_access_token,
      w.tiktok_test_event_code,
      w.tiktok_server_side_enabled
    INTO website_config
    FROM public.websites w
    WHERE w.id = NEW.website_id;

    IF website_config.tiktok_server_side_enabled = true 
       AND website_config.tiktok_pixel_id IS NOT NULL 
       AND website_config.tiktok_access_token IS NOT NULL THEN
      pixel_id := website_config.tiktok_pixel_id;
      access_token := website_config.tiktok_access_token;
      test_event_code := website_config.tiktok_test_event_code;
      server_side_enabled := true;
    END IF;
  END IF;

  -- If not found from website, try funnel
  IF server_side_enabled IS NULL AND NEW.funnel_id IS NOT NULL THEN
    SELECT 
      f.settings->>'tiktok_pixel_id' as tiktok_pixel_id,
      f.settings->>'tiktok_access_token' as tiktok_access_token,
      f.settings->>'tiktok_test_event_code' as tiktok_test_event_code,
      COALESCE((f.settings->>'tiktok_server_side_enabled')::boolean, false) as tiktok_server_side_enabled
    INTO funnel_config
    FROM public.funnels f
    WHERE f.id = NEW.funnel_id;

    IF funnel_config.tiktok_server_side_enabled = true 
       AND funnel_config.tiktok_pixel_id IS NOT NULL 
       AND funnel_config.tiktok_access_token IS NOT NULL THEN
      pixel_id := funnel_config.tiktok_pixel_id;
      access_token := funnel_config.tiktok_access_token;
      test_event_code := funnel_config.tiktok_test_event_code;
      server_side_enabled := true;
    END IF;
  END IF;

  -- Only skip if server-side tracking is NOT enabled
  IF server_side_enabled IS NOT TRUE OR pixel_id IS NULL OR access_token IS NULL THEN
    RETURN NEW; -- Skip if server-side not enabled or config missing
  END IF;

  -- Extract user data from event_data
  user_email := COALESCE(
    NEW.event_data->>'customer_email',
    NEW.event_data->>'email'
  );
  user_phone := COALESCE(
    NEW.event_data->>'customer_phone',
    NEW.event_data->>'phone'
  );
  user_name := NEW.event_data->>'customer_name';

  -- Extract browser context from event_data (for TikTok matching)
  -- These are captured client-side and stored in event_data
  ttclid := COALESCE(
    NEW.event_data->>'ttclid',
    NEW.ttclid
  );
  client_user_agent := COALESCE(
    NEW.event_data->>'client_user_agent',
    NEW.user_agent
  );
  event_source_url := COALESCE(
    NEW.event_data->>'event_source_url',
    NEW.page_url
  );

  -- Generate event_id for deduplication (use pixel_event id if available)
  event_id := COALESCE(
    NEW.event_data->>'event_id',
    NEW.tiktok_event_id,
    NEW.id::TEXT
  );

  -- Build request payload with browser context
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
    'browser_context', jsonb_build_object(
      'ttclid', ttclid,
      'client_user_agent', client_user_agent,
      'event_source_url', event_source_url
    ),
    'event_id', event_id,
    'event_time', EXTRACT(EPOCH FROM NEW.created_at)::INT,
    'test_event_code', NULLIF(test_event_code, '')
  );

  -- Call Edge Function via HTTP using pg_net extension
  BEGIN
    edge_function_url := supabase_url || '/functions/v1/send-tiktok-event';
    
    -- Use net.http_post to call edge function
    PERFORM net.http_post(
      url := edge_function_url,
      body := request_payload,  -- Pass as jsonb, not text
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      )
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the insert
      INSERT INTO public.tiktok_event_failures (
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
    INSERT INTO public.tiktok_event_failures (
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

-- Create trigger (separate from Facebook trigger)
DROP TRIGGER IF EXISTS forward_tiktok_events_trigger ON public.pixel_events;
CREATE TRIGGER forward_tiktok_events_trigger
AFTER INSERT ON public.pixel_events
FOR EACH ROW
EXECUTE FUNCTION public.forward_pixel_event_to_tiktok();
