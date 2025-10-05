-- Add custom URL fields to funnel_steps table for step navigation
-- This allows users to redirect to custom URLs instead of just funnel steps

ALTER TABLE public.funnel_steps 
ADD COLUMN on_success_custom_url TEXT,
ADD COLUMN on_accept_custom_url TEXT,
ADD COLUMN on_decline_custom_url TEXT;

-- Add comments for clarity
COMMENT ON COLUMN public.funnel_steps.on_success_custom_url IS 'Custom URL to redirect to after successful checkout completion';
COMMENT ON COLUMN public.funnel_steps.on_accept_custom_url IS 'Custom URL to redirect to when upsell/downsell offer is accepted';
COMMENT ON COLUMN public.funnel_steps.on_decline_custom_url IS 'Custom URL to redirect to when upsell/downsell offer is declined';
