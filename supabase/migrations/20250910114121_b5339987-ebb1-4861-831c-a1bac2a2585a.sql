-- Create career_openings table for managing job postings
CREATE TABLE public.career_openings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  employment_type TEXT DEFAULT 'full-time',
  description_html TEXT NOT NULL,
  requirements_html TEXT,
  apply_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.career_openings ENABLE ROW LEVEL SECURITY;

-- Create policies for career openings
CREATE POLICY "Anyone can view published career openings" 
ON public.career_openings 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Super admin can manage career openings" 
ON public.career_openings 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_career_openings_updated_at
BEFORE UPDATE ON public.career_openings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();