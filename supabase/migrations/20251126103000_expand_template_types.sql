-- Expand allowed template types beyond website/funnel and enforce valid values
ALTER TABLE public.page_templates
  DROP CONSTRAINT IF EXISTS page_templates_template_type_check;
ALTER TABLE public.page_templates
  ADD CONSTRAINT page_templates_template_type_check
  CHECK (
    template_type IN (
      'website_page',
      'funnel_step',
      'home_page',
      'about_page',
      'legal_page',
      'checkout_page',
      'upsell_page',
      'downsell_page',
      'thank_you_page'
    )
  );

ALTER TABLE public.page_templates
  DROP CONSTRAINT IF EXISTS page_templates_template_types_allowed_values;

ALTER TABLE public.page_templates
  ADD CONSTRAINT page_templates_template_types_allowed_values
  CHECK (
    template_types <@ ARRAY[
      'website_page',
      'funnel_step',
      'home_page',
      'about_page',
      'legal_page',
      'checkout_page',
      'upsell_page',
      'downsell_page',
      'thank_you_page'
    ]::text[]
  );

