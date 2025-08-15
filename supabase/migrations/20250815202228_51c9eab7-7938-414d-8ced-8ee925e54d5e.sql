-- Add website_id and funnel_id to orders table for better revenue tracking
ALTER TABLE public.orders 
ADD COLUMN website_id uuid,
ADD COLUMN funnel_id uuid;

-- Add indexes for performance
CREATE INDEX idx_orders_website_id ON public.orders(website_id);
CREATE INDEX idx_orders_funnel_id ON public.orders(funnel_id);

-- Create saas_subscriptions table for manual SaaS payments in BDT
CREATE TABLE public.saas_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_name text NOT NULL,
  plan_price_bdt numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'manual',
  subscription_status text NOT NULL DEFAULT 'active',
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  payment_reference text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for saas_subscriptions
CREATE POLICY "Super admin can manage saas subscriptions" 
ON public.saas_subscriptions 
FOR ALL 
USING (is_super_admin());

CREATE POLICY "Users can view their own subscription" 
ON public.saas_subscriptions 
FOR SELECT 
USING (user_id = auth.uid());

-- Add super_admin SELECT policies for reporting tables
CREATE POLICY "Super admin can view all orders for reporting" 
ON public.orders 
FOR SELECT 
USING (is_super_admin());

CREATE POLICY "Super admin can view all order_items for reporting" 
ON public.order_items 
FOR SELECT 
USING (is_super_admin());

CREATE POLICY "Super admin can view all customers for reporting" 
ON public.customers 
FOR SELECT 
USING (is_super_admin());

CREATE POLICY "Super admin can view all products for reporting" 
ON public.products 
FOR SELECT 
USING (is_super_admin());

CREATE POLICY "Super admin can view all website_analytics for reporting" 
ON public.website_analytics 
FOR SELECT 
USING (is_super_admin());

CREATE POLICY "Super admin can view all pixel_events for reporting" 
ON public.pixel_events 
FOR SELECT 
USING (is_super_admin());

-- Add trigger for updated_at on saas_subscriptions
CREATE TRIGGER update_saas_subscriptions_updated_at
BEFORE UPDATE ON public.saas_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();