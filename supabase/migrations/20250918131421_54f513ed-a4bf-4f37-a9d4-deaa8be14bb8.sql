-- Add course orders table
CREATE TABLE public.course_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  course_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_id TEXT,
  transaction_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for course orders
CREATE POLICY "Store owners can manage course orders" 
ON public.course_orders 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.stores 
  WHERE id = course_orders.store_id AND is_store_owner(id)
));

CREATE POLICY "Anyone can view course orders for verification" 
ON public.course_orders 
FOR SELECT 
USING (true);

-- Add course_order_id to member_content_access
ALTER TABLE public.member_content_access 
ADD COLUMN course_order_id UUID REFERENCES public.course_orders(id);

-- Update member_accounts to include course access status
ALTER TABLE public.member_accounts 
ADD COLUMN access_status TEXT NOT NULL DEFAULT 'pending';

-- Create function to create member account for course order
CREATE OR REPLACE FUNCTION public.create_member_account_for_course_order()
RETURNS TRIGGER AS $$
DECLARE
  member_account_record public.member_accounts%rowtype;
  generated_password text;
BEGIN
  -- Generate random password (8 characters)
  generated_password := substring(md5(random()::text) from 1 for 8);

  -- Create or get member account
  INSERT INTO public.member_accounts (
    store_id, email, password_hash, full_name, phone, access_status
  ) VALUES (
    NEW.store_id,
    NEW.customer_email,
    crypt(generated_password, gen_salt('bf')),
    NEW.customer_name,
    NEW.customer_phone,
    CASE WHEN NEW.payment_status = 'completed' THEN 'active' ELSE 'pending' END
  )
  ON CONFLICT (store_id, email) 
  DO UPDATE SET 
    full_name = COALESCE(member_accounts.full_name, NEW.customer_name),
    phone = COALESCE(member_accounts.phone, NEW.customer_phone),
    access_status = CASE WHEN NEW.payment_status = 'completed' THEN 'active' ELSE member_accounts.access_status END,
    updated_at = now()
  RETURNING * INTO member_account_record;

  -- Grant access to the course if payment is completed
  IF NEW.payment_status = 'completed' THEN
    INSERT INTO public.course_member_access (
      member_account_id, course_id, course_order_id, access_status
    ) VALUES (
      member_account_record.id,
      NEW.course_id,
      NEW.id,
      'active'
    )
    ON CONFLICT (member_account_id, course_id) 
    DO UPDATE SET 
      access_status = 'active',
      updated_at = now();
  ELSE
    -- Create pending access record
    INSERT INTO public.course_member_access (
      member_account_id, course_id, course_order_id, access_status
    ) VALUES (
      member_account_record.id,
      NEW.course_id,
      NEW.id,
      'pending'
    )
    ON CONFLICT (member_account_id, course_id) DO NOTHING;
  END IF;

  -- Store password in order metadata for display
  UPDATE public.course_orders 
  SET metadata = COALESCE(metadata, '{}'::jsonb) || 
    jsonb_build_object('member_password', generated_password)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for course orders
CREATE TRIGGER create_member_account_for_course_order_trigger
  AFTER INSERT ON public.course_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_member_account_for_course_order();

-- Create trigger for course order status updates
CREATE OR REPLACE FUNCTION public.update_member_access_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if payment status changed to completed
  IF OLD.payment_status != 'completed' AND NEW.payment_status = 'completed' THEN
    -- Update member account status
    UPDATE public.member_accounts 
    SET access_status = 'active', updated_at = now()
    WHERE store_id = NEW.store_id AND email = NEW.customer_email;
    
    -- Update course access status
    UPDATE public.course_member_access 
    SET access_status = 'active', updated_at = now()
    WHERE course_order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_member_access_on_payment_trigger
  AFTER UPDATE ON public.course_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_member_access_on_payment();