-- Create courses table
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  is_published boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  price numeric NOT NULL DEFAULT 0,
  compare_price numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Create course_modules table
CREATE TABLE public.course_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on course_modules
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

-- Create course_lessons table
CREATE TABLE public.course_lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid NOT NULL,
  title text NOT NULL,
  content text, -- Rich text content
  video_url text,
  video_duration integer, -- in seconds
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  is_preview boolean NOT NULL DEFAULT false, -- Allow preview without purchase
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on course_lessons
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

-- Create course_enrollments table for tracking student access
CREATE TABLE public.course_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL,
  member_account_id uuid NOT NULL,
  order_id uuid,
  enrolled_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(course_id, member_account_id)
);

-- Enable RLS on course_enrollments
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Store owners can manage courses"
ON public.courses
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.stores 
  WHERE stores.id = courses.store_id 
  AND public.is_store_owner(stores.id)
));

CREATE POLICY "Anyone can view published courses"
ON public.courses
FOR SELECT
USING (is_published = true AND is_active = true);

-- RLS Policies for course_modules
CREATE POLICY "Store owners can manage course modules"
ON public.course_modules
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.courses c
  JOIN public.stores s ON s.id = c.store_id
  WHERE c.id = course_modules.course_id 
  AND public.is_store_owner(s.id)
));

CREATE POLICY "Anyone can view published course modules"
ON public.course_modules
FOR SELECT
USING (is_published = true AND EXISTS (
  SELECT 1 FROM public.courses c
  WHERE c.id = course_modules.course_id 
  AND c.is_published = true 
  AND c.is_active = true
));

-- RLS Policies for course_lessons
CREATE POLICY "Store owners can manage course lessons"
ON public.course_lessons
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.course_modules cm
  JOIN public.courses c ON c.id = cm.course_id
  JOIN public.stores s ON s.id = c.store_id
  WHERE cm.id = course_lessons.module_id 
  AND public.is_store_owner(s.id)
));

CREATE POLICY "Anyone can view published course lessons"
ON public.course_lessons
FOR SELECT
USING (is_published = true AND EXISTS (
  SELECT 1 FROM public.course_modules cm
  JOIN public.courses c ON c.id = cm.course_id
  WHERE cm.id = course_lessons.module_id 
  AND cm.is_published = true 
  AND c.is_published = true 
  AND c.is_active = true
));

-- RLS Policies for course_enrollments
CREATE POLICY "Store owners can manage course enrollments"
ON public.course_enrollments
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.courses c
  JOIN public.stores s ON s.id = c.store_id
  WHERE c.id = course_enrollments.course_id 
  AND public.is_store_owner(s.id)
));

-- Foreign key constraints
ALTER TABLE public.course_modules 
ADD CONSTRAINT course_modules_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.course_lessons 
ADD CONSTRAINT course_lessons_module_id_fkey 
FOREIGN KEY (module_id) REFERENCES public.course_modules(id) ON DELETE CASCADE;

ALTER TABLE public.course_enrollments 
ADD CONSTRAINT course_enrollments_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.course_enrollments 
ADD CONSTRAINT course_enrollments_member_account_id_fkey 
FOREIGN KEY (member_account_id) REFERENCES public.member_accounts(id) ON DELETE CASCADE;