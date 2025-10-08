-- Enhance form_submissions table for custom form builder
-- Add new columns to support dynamic form fields and form management

ALTER TABLE public.form_submissions
ADD COLUMN IF NOT EXISTS form_name TEXT,
ADD COLUMN IF NOT EXISTS form_id TEXT,
ADD COLUMN IF NOT EXISTS funnel_id UUID REFERENCES public.funnels(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.form_submissions (form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_funnel_id ON public.form_submissions (funnel_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_name ON public.form_submissions (form_name);

-- Add comment to document the new columns
COMMENT ON COLUMN public.form_submissions.form_name IS 'Name of the form (e.g., Newsletter Signup, Contact Form)';
COMMENT ON COLUMN public.form_submissions.form_id IS 'Unique identifier for the form element instance';
COMMENT ON COLUMN public.form_submissions.funnel_id IS 'Link to funnel if submitted from funnel context';
COMMENT ON COLUMN public.form_submissions.custom_fields IS 'JSONB object storing all custom field values from the form';
