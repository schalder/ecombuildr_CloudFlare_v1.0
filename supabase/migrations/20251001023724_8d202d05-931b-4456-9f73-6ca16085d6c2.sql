-- Add EB Pay to platform payment options for subscription payments
INSERT INTO public.platform_payment_options
  (provider, display_name, is_enabled, account_number, instructions)
VALUES
  ('ebpay', 'EB Pay Gateway', false, '{}', 'EB Pay: Configure your gateway credentials below to enable automated subscription payments.')
ON CONFLICT (provider) DO NOTHING;