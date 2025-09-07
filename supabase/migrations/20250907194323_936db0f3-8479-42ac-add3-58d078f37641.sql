-- Create platform marketing content table
CREATE TABLE public.platform_marketing_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL UNIQUE,
  youtube_url text,
  hero_image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_marketing_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read active marketing content"
ON public.platform_marketing_content FOR SELECT
USING (is_active = true);

CREATE POLICY "Super admin can manage marketing content"
ON public.platform_marketing_content FOR ALL
USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Add updated_at trigger
CREATE TRIGGER update_platform_marketing_content_updated_at
BEFORE UPDATE ON public.platform_marketing_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default hero section
INSERT INTO public.platform_marketing_content (section) VALUES ('hero')
ON CONFLICT (section) DO NOTHING;