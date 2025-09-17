-- Phase 1: Database Schema Updates for Course Payment System

-- Add payment_methods to courses table
ALTER TABLE public.courses 
ADD COLUMN payment_methods jsonb DEFAULT '{"bkash": false, "nagad": false, "eps": false}'::jsonb;

-- Create course_orders table for tracking course purchases
CREATE TABLE public.course_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    total NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on course_orders
ALTER TABLE public.course_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for course_orders
CREATE POLICY "Store owners can view course orders" ON public.course_orders
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = course_orders.store_id 
        AND is_store_owner(stores.id)
    ));

CREATE POLICY "Anyone can create course orders for active stores" ON public.course_orders
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = course_orders.store_id 
        AND stores.is_active = true
    ));

CREATE POLICY "Store owners can update course orders" ON public.course_orders
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = course_orders.store_id 
        AND is_store_owner(stores.id)
    ));

-- Create index for performance
CREATE INDEX idx_course_orders_store_id ON public.course_orders(store_id);
CREATE INDEX idx_course_orders_course_id ON public.course_orders(course_id);
CREATE INDEX idx_course_orders_payment_status ON public.course_orders(payment_status);

-- Create course_member_access table for managing course access
CREATE TABLE public.course_member_access (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    member_account_id UUID NOT NULL REFERENCES public.member_accounts(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    course_order_id UUID REFERENCES public.course_orders(id) ON DELETE SET NULL,
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    access_status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(member_account_id, course_id)
);

-- Enable RLS on course_member_access
ALTER TABLE public.course_member_access ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for course_member_access
CREATE POLICY "Store owners can manage course member access" ON public.course_member_access
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.member_accounts ma
        JOIN public.stores s ON s.id = ma.store_id
        WHERE ma.id = course_member_access.member_account_id 
        AND is_store_owner(s.id)
    ));

-- Create trigger to automatically grant access for successful EPS payments
CREATE OR REPLACE FUNCTION public.handle_course_order_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    member_account_record public.member_accounts%rowtype;
    generated_password text;
BEGIN
    -- Only process successful payments
    IF NEW.payment_status != 'completed' OR OLD.payment_status = 'completed' THEN
        RETURN NEW;
    END IF;

    -- Generate random password for new member accounts
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

    -- Grant course access
    INSERT INTO public.course_member_access (
        member_account_id, course_id, course_order_id, access_status
    ) VALUES (
        member_account_record.id,
        NEW.course_id,
        NEW.id,
        CASE 
            WHEN NEW.payment_method = 'eps' THEN 'active'
            ELSE 'pending'
        END
    )
    ON CONFLICT (member_account_id, course_id) 
    DO UPDATE SET 
        access_status = CASE 
            WHEN NEW.payment_method = 'eps' THEN 'active'
            ELSE 'pending'
        END,
        updated_at = now();

    -- Store password in order metadata for email sending
    UPDATE public.course_orders 
    SET metadata = COALESCE(metadata, '{}'::jsonb) || 
        jsonb_build_object('member_password', generated_password)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$;

-- Create trigger for course order payment handling
CREATE TRIGGER course_order_payment_trigger
    AFTER UPDATE ON public.course_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_course_order_payment();