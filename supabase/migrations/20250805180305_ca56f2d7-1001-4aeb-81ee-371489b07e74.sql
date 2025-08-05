-- Create form submissions table for contact inquiries
CREATE TABLE public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  form_type TEXT NOT NULL DEFAULT 'contact',
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  message TEXT,
  product_id UUID,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(store_id, email)
);

-- Enable RLS
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_submissions
CREATE POLICY "Anyone can submit forms to active stores" 
ON public.form_submissions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = form_submissions.store_id 
    AND stores.is_active = true
  )
);

CREATE POLICY "Store owners can manage form submissions" 
ON public.form_submissions 
FOR ALL 
USING (is_store_owner(store_id));

-- RLS Policies for newsletter_subscribers
CREATE POLICY "Anyone can subscribe to active store newsletters" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = newsletter_subscribers.store_id 
    AND stores.is_active = true
  )
);

CREATE POLICY "Store owners can manage newsletter subscribers" 
ON public.newsletter_subscribers 
FOR ALL 
USING (is_store_owner(store_id));

-- Create trigger for form_submissions updated_at
CREATE TRIGGER update_form_submissions_updated_at
BEFORE UPDATE ON public.form_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();