
-- 1) Enum for lesson content type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'training_content_type') THEN
    CREATE TYPE public.training_content_type AS ENUM ('video', 'text', 'pdf', 'embed', 'link');
  END IF;
END $$;

-- 2) Tables
CREATE TABLE IF NOT EXISTS public.training_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text,
  description text,
  thumbnail_url text,
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  estimated_duration_minutes integer,
  sort_order integer NOT NULL DEFAULT 1,
  is_published boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type public.training_content_type NOT NULL,
  -- Optional fields depending on content_type
  video_url text,
  embed_code text,
  text_content text,
  pdf_url text,
  link_url text,
  duration_minutes integer,
  is_free_preview boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Validation trigger to ensure proper content fields by type
CREATE OR REPLACE FUNCTION public.validate_training_lesson()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.content_type = 'video' AND
     COALESCE(NULLIF(trim(NEW.video_url), ''), NULL) IS NULL AND
     COALESCE(NULLIF(trim(NEW.embed_code), ''), NULL) IS NULL THEN
    RAISE EXCEPTION 'Video lessons require video_url or embed_code';
  ELSIF NEW.content_type = 'text' AND
        COALESCE(NULLIF(trim(NEW.text_content), ''), NULL) IS NULL THEN
    RAISE EXCEPTION 'Text lessons require text_content';
  ELSIF NEW.content_type = 'pdf' AND
        COALESCE(NULLIF(trim(NEW.pdf_url), ''), NULL) IS NULL THEN
    RAISE EXCEPTION 'PDF lessons require pdf_url';
  ELSIF NEW.content_type = 'embed' AND
        COALESCE(NULLIF(trim(NEW.embed_code), ''), NULL) IS NULL THEN
    RAISE EXCEPTION 'Embed lessons require embed_code';
  ELSIF NEW.content_type = 'link' AND
        COALESCE(NULLIF(trim(NEW.link_url), ''), NULL) IS NULL THEN
    RAISE EXCEPTION 'Link lessons require link_url';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_training_lesson ON public.training_lessons;
CREATE TRIGGER trg_validate_training_lesson
BEFORE INSERT OR UPDATE ON public.training_lessons
FOR EACH ROW EXECUTE PROCEDURE public.validate_training_lesson();

-- 4) Keep updated_at fresh
DROP TRIGGER IF EXISTS set_timestamp_training_courses ON public.training_courses;
CREATE TRIGGER set_timestamp_training_courses
BEFORE UPDATE ON public.training_courses
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_timestamp_training_modules ON public.training_modules;
CREATE TRIGGER set_timestamp_training_modules
BEFORE UPDATE ON public.training_modules
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_timestamp_training_lessons ON public.training_lessons;
CREATE TRIGGER set_timestamp_training_lessons
BEFORE UPDATE ON public.training_lessons
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- 5) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_training_modules_course_sort
  ON public.training_modules (course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_training_lessons_module_sort
  ON public.training_lessons (module_id, sort_order);

-- 6) Row Level Security
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_lessons ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view published/active courses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'training_courses'
      AND policyname = 'Authenticated users can view published training courses'
  ) THEN
    CREATE POLICY "Authenticated users can view published training courses"
      ON public.training_courses
      FOR SELECT
      USING (is_published = true AND is_active = true AND auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Authenticated users can view modules of published courses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'training_modules'
      AND policyname = 'Authenticated users can view training modules of published courses'
  ) THEN
    CREATE POLICY "Authenticated users can view training modules of published courses"
      ON public.training_modules
      FOR SELECT
      USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
          SELECT 1
          FROM public.training_courses c
          WHERE c.id = training_modules.course_id
            AND c.is_published = true
            AND c.is_active = true
        )
      );
  END IF;
END $$;

-- Authenticated users can view lessons of published courses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'training_lessons'
      AND policyname = 'Authenticated users can view training lessons of published courses'
  ) THEN
    CREATE POLICY "Authenticated users can view training lessons of published courses"
      ON public.training_lessons
      FOR SELECT
      USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
          SELECT 1
          FROM public.training_modules m
          JOIN public.training_courses c ON c.id = m.course_id
          WHERE m.id = training_lessons.module_id
            AND c.is_published = true
            AND c.is_active = true
        )
      );
  END IF;
END $$;

-- Super admin can manage courses/modules/lessons
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'training_courses'
      AND policyname = 'Super admin can manage training courses'
  ) THEN
    CREATE POLICY "Super admin can manage training courses"
      ON public.training_courses
      FOR ALL
      USING (is_super_admin())
      WITH CHECK (is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'training_modules'
      AND policyname = 'Super admin can manage training modules'
  ) THEN
    CREATE POLICY "Super admin can manage training modules"
      ON public.training_modules
      FOR ALL
      USING (is_super_admin())
      WITH CHECK (is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'training_lessons'
      AND policyname = 'Super admin can manage training lessons'
  ) THEN
    CREATE POLICY "Super admin can manage training lessons"
      ON public.training_lessons
      FOR ALL
      USING (is_super_admin())
      WITH CHECK (is_super_admin());
  END IF;
END $$;
