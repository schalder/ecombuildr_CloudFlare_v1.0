-- Create platform support settings table for WhatsApp live chat
CREATE TABLE public.platform_support_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_number text NOT NULL,
  welcome_message text NOT NULL DEFAULT 'Hi! I need help with my account.',
  is_enabled boolean NOT NULL DEFAULT false,
  widget_position text NOT NULL DEFAULT 'bottom-right',
  availability_message text DEFAULT 'We''ll get back to you as soon as possible!',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_support_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view support settings" 
ON public.platform_support_settings 
FOR SELECT 
USING (is_enabled = true);

CREATE POLICY "Super admin can manage support settings" 
ON public.platform_support_settings 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_platform_support_settings_updated_at
BEFORE UPDATE ON public.platform_support_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();