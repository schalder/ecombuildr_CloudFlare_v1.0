-- Add missing cleanup triggers and perform one-time cleanup of orphaned html snapshots

DO $$
BEGIN
  -- Cleanup after delete: website pages
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cleanup_after_delete_website_page') THEN
    CREATE TRIGGER trg_cleanup_after_delete_website_page
    AFTER DELETE ON public.website_pages
    FOR EACH ROW EXECUTE FUNCTION public.cleanup_after_delete_website_page();
  END IF;

  -- Cleanup after delete: funnel steps
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cleanup_after_delete_funnel_step') THEN
    CREATE TRIGGER trg_cleanup_after_delete_funnel_step
    AFTER DELETE ON public.funnel_steps
    FOR EACH ROW EXECUTE FUNCTION public.cleanup_after_delete_funnel_step();
  END IF;

  -- Cleanup after delete: websites
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cleanup_after_delete_website') THEN
    CREATE TRIGGER trg_cleanup_after_delete_website
    AFTER DELETE ON public.websites
    FOR EACH ROW EXECUTE FUNCTION public.cleanup_after_delete_website();
  END IF;

  -- Cleanup after delete: funnels
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cleanup_after_delete_funnel') THEN
    CREATE TRIGGER trg_cleanup_after_delete_funnel
    AFTER DELETE ON public.funnels
    FOR EACH ROW EXECUTE FUNCTION public.cleanup_after_delete_funnel();
  END IF;

  -- Prevent deleting websites that still have pages
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_delete_website_if_pages') THEN
    CREATE TRIGGER trg_prevent_delete_website_if_pages
    BEFORE DELETE ON public.websites
    FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_website_if_pages();
  END IF;

  -- Prevent deleting funnels that still have steps
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_delete_funnel_if_steps') THEN
    CREATE TRIGGER trg_prevent_delete_funnel_if_steps
    BEFORE DELETE ON public.funnels
    FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_funnel_if_steps();
  END IF;
END
$$;

-- One-time cleanup of orphan html snapshots
-- Remove website_page snapshots whose page no longer exists
DELETE FROM public.html_snapshots s
WHERE s.content_type = 'website_page'
  AND NOT EXISTS (SELECT 1 FROM public.website_pages wp WHERE wp.id = s.content_id);

-- Remove funnel_step snapshots whose step no longer exists
DELETE FROM public.html_snapshots s
WHERE s.content_type = 'funnel_step'
  AND NOT EXISTS (SELECT 1 FROM public.funnel_steps fs WHERE fs.id = s.content_id);

-- Remove website snapshots whose website no longer exists
DELETE FROM public.html_snapshots s
WHERE s.content_type = 'website'
  AND NOT EXISTS (SELECT 1 FROM public.websites w WHERE w.id = s.content_id);

-- Remove funnel snapshots whose funnel no longer exists
DELETE FROM public.html_snapshots s
WHERE s.content_type = 'funnel'
  AND NOT EXISTS (SELECT 1 FROM public.funnels f WHERE f.id = s.content_id);