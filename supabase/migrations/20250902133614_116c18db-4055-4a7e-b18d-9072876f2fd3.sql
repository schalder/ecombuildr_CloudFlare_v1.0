-- Add funnel flow configuration columns to funnel_steps
ALTER TABLE public.funnel_steps 
ADD COLUMN on_success_step_id uuid REFERENCES public.funnel_steps(id) ON DELETE SET NULL,
ADD COLUMN on_accept_step_id uuid REFERENCES public.funnel_steps(id) ON DELETE SET NULL, 
ADD COLUMN on_decline_step_id uuid REFERENCES public.funnel_steps(id) ON DELETE SET NULL,
ADD COLUMN offer_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
ADD COLUMN offer_price numeric DEFAULT NULL,
ADD COLUMN offer_quantity integer DEFAULT 1;

-- Add comments for clarity
COMMENT ON COLUMN public.funnel_steps.on_success_step_id IS 'Next step after successful checkout completion';
COMMENT ON COLUMN public.funnel_steps.on_accept_step_id IS 'Next step when upsell/downsell offer is accepted';
COMMENT ON COLUMN public.funnel_steps.on_decline_step_id IS 'Next step when upsell/downsell offer is declined';
COMMENT ON COLUMN public.funnel_steps.offer_product_id IS 'Product offered in upsell/downsell steps';
COMMENT ON COLUMN public.funnel_steps.offer_price IS 'Special price for the offered product';
COMMENT ON COLUMN public.funnel_steps.offer_quantity IS 'Quantity of the offered product';