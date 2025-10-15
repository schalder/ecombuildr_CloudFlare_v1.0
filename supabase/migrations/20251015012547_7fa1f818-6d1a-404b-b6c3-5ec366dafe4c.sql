-- Add custom URL columns to funnel_steps table
ALTER TABLE public.funnel_steps 
ADD COLUMN IF NOT EXISTS on_success_custom_url text,
ADD COLUMN IF NOT EXISTS on_accept_custom_url text,
ADD COLUMN IF NOT EXISTS on_decline_custom_url text;

COMMENT ON COLUMN public.funnel_steps.on_success_custom_url IS 'Custom redirect URL for successful form submission (takes priority over on_success_step_id)';
COMMENT ON COLUMN public.funnel_steps.on_accept_custom_url IS 'Custom redirect URL when user accepts (takes priority over on_accept_step_id)';
COMMENT ON COLUMN public.funnel_steps.on_decline_custom_url IS 'Custom redirect URL when user declines (takes priority over on_decline_step_id)';