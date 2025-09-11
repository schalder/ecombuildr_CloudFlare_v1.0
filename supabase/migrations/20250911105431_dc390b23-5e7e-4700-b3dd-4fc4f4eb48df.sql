-- Add new columns to user_usage table for tracking products and pages
ALTER TABLE public.user_usage 
ADD COLUMN IF NOT EXISTS current_products integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_pages integer NOT NULL DEFAULT 0;

-- Create function to enforce plan limits before resource creation
CREATE OR REPLACE FUNCTION public.enforce_plan_limits(_user_id uuid, _resource_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_plan text;
  plan_limit integer;
  current_usage integer;
  account_status text;
  trial_expires timestamp with time zone;
  monthly_orders integer;
BEGIN
  -- Get user plan, account status, and trial info
  SELECT p.subscription_plan::text, p.account_status, p.trial_expires_at 
  INTO user_plan, account_status, trial_expires
  FROM public.profiles p
  WHERE p.id = _user_id;
  
  -- Check if account is suspended or read-only
  IF account_status IN ('suspended', 'read_only') THEN
    RETURN false;
  END IF;
  
  -- Check if trial has expired for trial accounts
  IF account_status = 'trial' AND trial_expires IS NOT NULL AND trial_expires < now() THEN
    RETURN false;
  END IF;
  
  -- Get plan limits and current usage
  SELECT 
    CASE 
      WHEN _resource_type = 'website' THEN pl.max_websites
      WHEN _resource_type = 'funnel' THEN pl.max_funnels
      WHEN _resource_type = 'page' THEN pl.max_pages_per_store
      WHEN _resource_type = 'product' THEN pl.max_products_per_store
      WHEN _resource_type = 'order' THEN pl.max_orders_per_month
      ELSE NULL
    END,
    CASE 
      WHEN _resource_type = 'website' THEN uu.current_websites
      WHEN _resource_type = 'funnel' THEN uu.current_funnels
      WHEN _resource_type = 'page' THEN uu.current_pages
      WHEN _resource_type = 'product' THEN uu.current_products
      ELSE 0
    END
  INTO plan_limit, current_usage
  FROM public.plan_limits pl
  CROSS JOIN public.user_usage uu
  WHERE pl.plan_name::text = user_plan AND uu.user_id = _user_id;
  
  -- Special handling for monthly orders
  IF _resource_type = 'order' THEN
    SELECT COUNT(*)::integer
    INTO monthly_orders
    FROM public.orders o
    JOIN public.stores s ON s.id = o.store_id
    WHERE s.owner_id = _user_id 
      AND o.created_at >= date_trunc('month', now())
      AND o.status != 'cancelled';
    current_usage := monthly_orders;
  END IF;
  
  -- If plan_limit is NULL, it means unlimited
  IF plan_limit IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if current usage is below limit
  RETURN current_usage < plan_limit;
END;
$$;

-- Function to update product count
CREATE OR REPLACE FUNCTION public.update_product_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  store_owner_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT owner_id INTO store_owner_id FROM public.stores WHERE id = NEW.store_id;
    
    -- Check limits before allowing insert
    IF NOT public.enforce_plan_limits(store_owner_id, 'product') THEN
      RAISE EXCEPTION 'Product limit reached for your current plan';
    END IF;
    
    -- Update count
    UPDATE public.user_usage 
    SET current_products = current_products + 1, updated_at = now()
    WHERE user_id = store_owner_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT owner_id INTO store_owner_id FROM public.stores WHERE id = OLD.store_id;
    
    -- Update count
    UPDATE public.user_usage 
    SET current_products = GREATEST(0, current_products - 1), updated_at = now()
    WHERE user_id = store_owner_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Function to update page count (for website pages and funnel steps)
CREATE OR REPLACE FUNCTION public.update_page_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  store_owner_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get store owner based on table
    IF TG_TABLE_NAME = 'website_pages' THEN
      SELECT s.owner_id INTO store_owner_id 
      FROM public.websites w 
      JOIN public.stores s ON s.id = w.store_id 
      WHERE w.id = NEW.website_id;
    ELSIF TG_TABLE_NAME = 'funnel_steps' THEN
      SELECT s.owner_id INTO store_owner_id 
      FROM public.funnels f 
      JOIN public.stores s ON s.id = f.store_id 
      WHERE f.id = NEW.funnel_id;
    END IF;
    
    -- Check limits before allowing insert
    IF NOT public.enforce_plan_limits(store_owner_id, 'page') THEN
      RAISE EXCEPTION 'Page limit reached for your current plan';
    END IF;
    
    -- Update count
    UPDATE public.user_usage 
    SET current_pages = current_pages + 1, updated_at = now()
    WHERE user_id = store_owner_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Get store owner based on table
    IF TG_TABLE_NAME = 'website_pages' THEN
      SELECT s.owner_id INTO store_owner_id 
      FROM public.websites w 
      JOIN public.stores s ON s.id = w.store_id 
      WHERE w.id = OLD.website_id;
    ELSIF TG_TABLE_NAME = 'funnel_steps' THEN
      SELECT s.owner_id INTO store_owner_id 
      FROM public.funnels f 
      JOIN public.stores s ON s.id = f.store_id 
      WHERE f.id = OLD.funnel_id;
    END IF;
    
    -- Update count
    UPDATE public.user_usage 
    SET current_pages = GREATEST(0, current_pages - 1), updated_at = now()
    WHERE user_id = store_owner_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Function to check website/funnel limits
CREATE OR REPLACE FUNCTION public.check_resource_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  store_owner_id uuid;
  resource_type text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Determine resource type and get store owner
    IF TG_TABLE_NAME = 'websites' THEN
      resource_type := 'website';
      SELECT owner_id INTO store_owner_id FROM public.stores WHERE id = NEW.store_id;
    ELSIF TG_TABLE_NAME = 'funnels' THEN
      resource_type := 'funnel';
      SELECT owner_id INTO store_owner_id FROM public.stores WHERE id = NEW.store_id;
    ELSIF TG_TABLE_NAME = 'orders' THEN
      resource_type := 'order';
      SELECT owner_id INTO store_owner_id FROM public.stores WHERE id = NEW.store_id;
    END IF;
    
    -- Check limits
    IF NOT public.enforce_plan_limits(store_owner_id, resource_type) THEN
      RAISE EXCEPTION '% limit reached for your current plan', INITCAP(resource_type);
    END IF;
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers for product count tracking
DROP TRIGGER IF EXISTS trigger_update_product_count ON public.products;
CREATE TRIGGER trigger_update_product_count
  BEFORE INSERT OR AFTER DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_product_count();

-- Create triggers for page count tracking
DROP TRIGGER IF EXISTS trigger_update_website_page_count ON public.website_pages;
CREATE TRIGGER trigger_update_website_page_count
  BEFORE INSERT OR AFTER DELETE ON public.website_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_page_count();

DROP TRIGGER IF EXISTS trigger_update_funnel_step_count ON public.funnel_steps;
CREATE TRIGGER trigger_update_funnel_step_count
  BEFORE INSERT OR AFTER DELETE ON public.funnel_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_page_count();

-- Create triggers for resource limit checking
DROP TRIGGER IF EXISTS trigger_check_website_limits ON public.websites;
CREATE TRIGGER trigger_check_website_limits
  BEFORE INSERT ON public.websites
  FOR EACH ROW EXECUTE FUNCTION public.check_resource_limits();

DROP TRIGGER IF EXISTS trigger_check_funnel_limits ON public.funnels;
CREATE TRIGGER trigger_check_funnel_limits
  BEFORE INSERT ON public.funnels
  FOR EACH ROW EXECUTE FUNCTION public.check_resource_limits();

DROP TRIGGER IF EXISTS trigger_check_order_limits ON public.orders;
CREATE TRIGGER trigger_check_order_limits
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.check_resource_limits();

-- Initialize current counts for existing users
UPDATE public.user_usage 
SET 
  current_products = (
    SELECT COALESCE(COUNT(*), 0)
    FROM public.products p 
    JOIN public.stores s ON s.id = p.store_id 
    WHERE s.owner_id = user_usage.user_id
  ),
  current_pages = (
    SELECT COALESCE(COUNT(*), 0)
    FROM (
      SELECT 1 FROM public.website_pages wp 
      JOIN public.websites w ON w.id = wp.website_id 
      JOIN public.stores s ON s.id = w.store_id 
      WHERE s.owner_id = user_usage.user_id
      UNION ALL
      SELECT 1 FROM public.funnel_steps fs 
      JOIN public.funnels f ON f.id = fs.funnel_id 
      JOIN public.stores s ON s.id = f.store_id 
      WHERE s.owner_id = user_usage.user_id
    ) as combined_pages
  ),
  updated_at = now()
WHERE user_id IS NOT NULL;