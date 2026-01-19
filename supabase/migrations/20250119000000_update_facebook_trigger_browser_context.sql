-- Update Facebook server-side tracking trigger to extract and pass browser context
-- This enables proper event matching even when user PII (email/phone) is missing
-- Browser context (fbp, fbc cookies) allows Facebook to match server events to browser sessions

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
  -- Browser context variables (for matching when PII is missing)
  fbp_cookie TEXT;
  fbc_cookie TEXT;
  client_user_agent TEXT;
  event_source_url TEXT;
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

  -- Extract browser context from event_data (for matching when PII is missing)
  -- These are captured client-side and stored in event_data
  fbp_cookie := NEW.event_data->>'fbp';
  fbc_cookie := NEW.event_data->>'fbc';
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
      'fbp', fbp_cookie,
      'fbc', fbc_cookie,
      'client_user_agent', client_user_agent,
      'event_source_url', event_source_url
    ),
    'event_id', event_id,
    'event_time', EXTRACT(EPOCH FROM NEW.created_at)::INT,
    'test_event_code', NULLIF(test_event_code, '')
  );

  -- Call Edge Function via HTTP using pg_net extension
  BEGIN
    edge_function_url := supabase_url || '/functions/v1/send-facebook-event';
    
    PERFORM net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := request_payload::text
    );
    
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
