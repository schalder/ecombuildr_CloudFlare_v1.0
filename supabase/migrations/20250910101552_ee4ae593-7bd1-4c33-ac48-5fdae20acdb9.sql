-- Create enums for roadmap and feedback
CREATE TYPE public.roadmap_status AS ENUM ('planned', 'in_progress', 'shipped', 'backlog');
CREATE TYPE public.feedback_status AS ENUM ('new', 'under_review', 'planned', 'rejected', 'implemented');

-- Create platform_roadmap_items table
CREATE TABLE public.platform_roadmap_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status roadmap_status NOT NULL DEFAULT 'planned',
  priority INTEGER NOT NULL DEFAULT 0,
  target_date DATE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create platform_changelog_entries table
CREATE TABLE public.platform_changelog_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create platform_feedback table
CREATE TABLE public.platform_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status feedback_status NOT NULL DEFAULT 'new',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.platform_roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_changelog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for platform_roadmap_items
CREATE POLICY "Anyone can view published roadmap items" 
ON public.platform_roadmap_items 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Super admin can manage roadmap items" 
ON public.platform_roadmap_items 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Create RLS policies for platform_changelog_entries
CREATE POLICY "Anyone can view published changelog entries" 
ON public.platform_changelog_entries 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Super admin can manage changelog entries" 
ON public.platform_changelog_entries 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Create RLS policies for platform_feedback
CREATE POLICY "Users can view their own feedback" 
ON public.platform_feedback 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can submit feedback" 
ON public.platform_feedback 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update their own feedback" 
ON public.platform_feedback 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admin can manage all feedback" 
ON public.platform_feedback 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Create triggers for updated_at columns
CREATE TRIGGER update_platform_roadmap_items_updated_at
BEFORE UPDATE ON public.platform_roadmap_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_changelog_entries_updated_at
BEFORE UPDATE ON public.platform_changelog_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_feedback_updated_at
BEFORE UPDATE ON public.platform_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();