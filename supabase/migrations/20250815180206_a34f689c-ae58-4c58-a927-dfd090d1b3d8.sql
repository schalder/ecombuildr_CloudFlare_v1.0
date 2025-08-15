-- Phase 1: Database Schema Updates for User Role System & Pricing Plans

-- Update subscription_plan enum to include all pricing tiers
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'starter';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'professional';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'enterprise';

-- Add trial tracking and account status fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS trial_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active'::text CHECK (account_status IN ('active', 'suspended', 'trial', 'expired'));

-- Create plan_limits table to define pricing and feature limits
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name subscription_plan NOT NULL UNIQUE,
  price_bdt numeric NOT NULL DEFAULT 0,
  trial_days integer NOT NULL DEFAULT 0,
  max_stores integer DEFAULT NULL, -- NULL means unlimited
  max_websites integer DEFAULT NULL,
  max_funnels integer DEFAULT NULL, 
  max_pages_per_store integer DEFAULT NULL,
  max_products_per_store integer DEFAULT NULL,
  max_orders_per_month integer DEFAULT NULL,
  custom_domain_allowed boolean DEFAULT false,
  priority_support boolean DEFAULT false,
  white_label boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert plan limits data
INSERT INTO public.plan_limits (plan_name, price_bdt, trial_days, max_stores, max_websites, max_funnels, max_pages_per_store, max_products_per_store, max_orders_per_month, custom_domain_allowed, priority_support, white_label) 
VALUES 
  ('free', 0, 0, 0, 0, 0, 0, 0, 0, false, false, false),
  ('starter', 500, 7, 1, 1, 1, 20, 50, 100, false, false, false),
  ('professional', 1500, 7, 5, 5, 10, 50, 100, 300, true, true, false),
  ('enterprise', 2999, 7, NULL, NULL, NULL, NULL, NULL, NULL, true, true, true)
ON CONFLICT (plan_name) DO UPDATE SET
  price_bdt = EXCLUDED.price_bdt,
  trial_days = EXCLUDED.trial_days,
  max_stores = EXCLUDED.max_stores,
  max_websites = EXCLUDED.max_websites,
  max_funnels = EXCLUDED.max_funnels,
  max_pages_per_store = EXCLUDED.max_pages_per_store,
  max_products_per_store = EXCLUDED.max_products_per_store,
  max_orders_per_month = EXCLUDED.max_orders_per_month,
  custom_domain_allowed = EXCLUDED.custom_domain_allowed,
  priority_support = EXCLUDED.priority_support,
  white_label = EXCLUDED.white_label;

-- Create user_usage table to track current usage
CREATE TABLE IF NOT EXISTS public.user_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_stores integer NOT NULL DEFAULT 0,
  current_websites integer NOT NULL DEFAULT 0,
  current_funnels integer NOT NULL DEFAULT 0,
  current_orders_this_month integer NOT NULL DEFAULT 0,
  last_reset_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for plan_limits (readable by all authenticated users)
CREATE POLICY "Anyone can view plan limits" ON public.plan_limits
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin can manage plan limits" ON public.plan_limits
  FOR ALL TO authenticated USING (is_super_admin());

-- RLS policies for user_usage
CREATE POLICY "Users can view own usage" ON public.user_usage
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Super admin can view all usage" ON public.user_usage
  FOR SELECT TO authenticated USING (is_super_admin());

CREATE POLICY "System can manage usage" ON public.user_usage
  FOR ALL TO authenticated USING (auth.uid() = user_id OR is_super_admin());

-- Function to initialize user usage when profile is created
CREATE OR REPLACE FUNCTION public.initialize_user_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_usage (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create usage record when profile is created
CREATE TRIGGER initialize_user_usage_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_usage();

-- Function to check if user can create resource based on plan limits
CREATE OR REPLACE FUNCTION public.can_create_resource(
  _user_id uuid,
  _resource_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan subscription_plan;
  plan_limit integer;
  current_usage integer;
  account_status text;
  trial_expires timestamp with time zone;
BEGIN
  -- Get user plan, account status, and trial info
  SELECT p.subscription_plan, p.account_status, p.trial_expires_at 
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
  WHERE pl.plan_name = user_plan AND uu.user_id = _user_id;
  
  -- If plan_limit is NULL, it means unlimited
  IF plan_limit IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if current usage is below limit
  RETURN current_usage < plan_limit;
END;
$$;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_usage(
  _user_id uuid,
  _resource_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to decrement usage count  
CREATE OR REPLACE FUNCTION public.decrement_usage(
  _user_id uuid,
  _resource_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Trigger to update usage when stores are created/deleted
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER store_usage_trigger
  AFTER INSERT OR DELETE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_store_usage();

-- Trigger to update usage when websites are created/deleted
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER website_usage_trigger
  AFTER INSERT OR DELETE ON public.websites
  FOR EACH ROW EXECUTE FUNCTION public.update_website_usage();

-- Add updated_at trigger to plan_limits and user_usage
CREATE TRIGGER update_plan_limits_updated_at
  BEFORE UPDATE ON public.plan_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_usage_updated_at
  BEFORE UPDATE ON public.user_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();