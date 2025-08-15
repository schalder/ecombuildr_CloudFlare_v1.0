-- Fix security warnings by setting proper search_path for functions

-- Update initialize_user_usage function
CREATE OR REPLACE FUNCTION public.initialize_user_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_usage (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update can_create_resource function
CREATE OR REPLACE FUNCTION public.can_create_resource(
  _user_id uuid,
  _resource_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_plan text;
  plan_limit integer;
  current_usage integer;
  account_status text;
  trial_expires timestamp with time zone;
BEGIN
  -- Get user plan, account status, and trial info
  SELECT p.subscription_plan::text, p.account_status, p.trial_expires_at 
  INTO user_plan, account_status, trial_expires
  FROM public.profiles p
  WHERE p.id = _user_id;
  
  -- Check if account is suspended
  IF account_status = 'suspended' THEN
    RETURN false;
  END IF;
  
  -- Check if trial has expired for trial accounts
  IF account_status = 'trial' AND trial_expires IS NOT NULL AND trial_expires < now() THEN
    RETURN false;
  END IF;
  
  -- Get plan limits and current usage
  SELECT 
    CASE 
      WHEN _resource_type = 'store' THEN pl.max_stores
      WHEN _resource_type = 'website' THEN pl.max_websites  
      WHEN _resource_type = 'funnel' THEN pl.max_funnels
      ELSE NULL
    END,
    CASE 
      WHEN _resource_type = 'store' THEN uu.current_stores
      WHEN _resource_type = 'website' THEN uu.current_websites
      WHEN _resource_type = 'funnel' THEN uu.current_funnels
      ELSE 0
    END
  INTO plan_limit, current_usage
  FROM public.plan_limits pl
  CROSS JOIN public.user_usage uu
  WHERE pl.plan_name::text = user_plan AND uu.user_id = _user_id;
  
  -- If plan_limit is NULL, it means unlimited
  IF plan_limit IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if current usage is below limit
  RETURN current_usage < plan_limit;
END;
$$;

-- Update increment_usage function
CREATE OR REPLACE FUNCTION public.increment_usage(
  _user_id uuid,
  _resource_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.user_usage
  SET 
    current_stores = CASE WHEN _resource_type = 'store' THEN current_stores + 1 ELSE current_stores END,
    current_websites = CASE WHEN _resource_type = 'website' THEN current_websites + 1 ELSE current_websites END,
    current_funnels = CASE WHEN _resource_type = 'funnel' THEN current_funnels + 1 ELSE current_funnels END,
    updated_at = now()
  WHERE user_id = _user_id;
END;
$$;

-- Update decrement_usage function
CREATE OR REPLACE FUNCTION public.decrement_usage(
  _user_id uuid,
  _resource_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.user_usage
  SET 
    current_stores = CASE WHEN _resource_type = 'store' THEN GREATEST(0, current_stores - 1) ELSE current_stores END,
    current_websites = CASE WHEN _resource_type = 'website' THEN GREATEST(0, current_websites - 1) ELSE current_websites END,
    current_funnels = CASE WHEN _resource_type = 'funnel' THEN GREATEST(0, current_funnels - 1) ELSE current_funnels END,
    updated_at = now()
  WHERE user_id = _user_id;
END;
$$;

-- Update store usage trigger function
CREATE OR REPLACE FUNCTION public.update_store_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.increment_usage(NEW.owner_id, 'store');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.decrement_usage(OLD.owner_id, 'store');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update website usage trigger function
CREATE OR REPLACE FUNCTION public.update_website_usage()
RETURNS TRIGGER AS $$
DECLARE
  store_owner_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT owner_id INTO store_owner_id FROM public.stores WHERE id = NEW.store_id;
    PERFORM public.increment_usage(store_owner_id, 'website');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT owner_id INTO store_owner_id FROM public.stores WHERE id = OLD.store_id;
    PERFORM public.decrement_usage(store_owner_id, 'website');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';