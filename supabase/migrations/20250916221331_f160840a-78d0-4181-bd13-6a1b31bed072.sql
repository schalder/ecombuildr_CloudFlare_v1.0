-- Add membership fields to products table
ALTER TABLE public.products 
ADD COLUMN is_membership boolean NOT NULL DEFAULT false,
ADD COLUMN membership_content jsonb DEFAULT '{"type": "course", "content": []}'::jsonb;

-- Create member_accounts table for customer login credentials
CREATE TABLE public.member_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  full_name text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_login_at timestamp with time zone,
  UNIQUE(store_id, email)
);

-- Enable RLS on member_accounts
ALTER TABLE public.member_accounts ENABLE ROW LEVEL SECURITY;

-- Create member_content_access table for tracking purchased content
CREATE TABLE public.member_content_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_account_id uuid NOT NULL,
  product_id uuid NOT NULL,
  order_id uuid NOT NULL,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(member_account_id, product_id)
);

-- Enable RLS on member_content_access
ALTER TABLE public.member_content_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for member_accounts
CREATE POLICY "Store owners can manage member accounts"
ON public.member_accounts
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.stores 
  WHERE stores.id = member_accounts.store_id 
  AND public.is_store_owner(stores.id)
));

-- RLS Policies for member_content_access  
CREATE POLICY "Store owners can manage member content access"
ON public.member_content_access
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.member_accounts ma
  JOIN public.stores s ON s.id = ma.store_id
  WHERE ma.id = member_content_access.member_account_id 
  AND public.is_store_owner(s.id)
));

-- Function to create member account after order completion
CREATE OR REPLACE FUNCTION public.create_member_account_for_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  has_membership_product boolean := false;
  member_account_record public.member_accounts%rowtype;
  generated_password text;
  order_item_record record;
BEGIN
  -- Only process delivered orders
  IF NEW.status != 'delivered' OR OLD.status = 'delivered' THEN
    RETURN NEW;
  END IF;

  -- Check if order contains membership products
  SELECT EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = NEW.id AND p.is_membership = true
  ) INTO has_membership_product;

  IF NOT has_membership_product THEN
    RETURN NEW;
  END IF;

  -- Generate random password (8 characters)
  generated_password := substring(md5(random()::text) from 1 for 8);

  -- Create or get member account
  INSERT INTO public.member_accounts (
    store_id, email, password_hash, full_name, phone
  ) VALUES (
    NEW.store_id,
    NEW.customer_email,
    crypt(generated_password, gen_salt('bf')),
    NEW.customer_name,
    NEW.customer_phone
  )
  ON CONFLICT (store_id, email) 
  DO UPDATE SET 
    full_name = COALESCE(member_accounts.full_name, NEW.customer_name),
    phone = COALESCE(member_accounts.phone, NEW.customer_phone),
    updated_at = now()
  RETURNING * INTO member_account_record;

  -- Grant access to purchased membership products
  FOR order_item_record IN 
    SELECT oi.product_id FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id  
    WHERE oi.order_id = NEW.id AND p.is_membership = true
  LOOP
    INSERT INTO public.member_content_access (
      member_account_id, product_id, order_id
    ) VALUES (
      member_account_record.id,
      order_item_record.product_id,
      NEW.id
    )
    ON CONFLICT (member_account_id, product_id) DO NOTHING;
  END LOOP;

  -- Store password in order metadata for email sending
  UPDATE public.orders 
  SET metadata = COALESCE(metadata, '{}'::jsonb) || 
    jsonb_build_object('member_password', generated_password)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Create trigger for member account creation
CREATE TRIGGER create_member_account_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_member_account_for_order();