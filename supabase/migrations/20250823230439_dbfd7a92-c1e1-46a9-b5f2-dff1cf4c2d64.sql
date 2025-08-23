
-- 1) Ensure realtime works for notifications
-- REPLICA IDENTITY FULL is primarily needed for UPDATE/DELETE, but it's fine to set for completeness
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add notifications table to the supabase_realtime publication if not already included
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 2) Remove Payment Received notifications generator to match product decision
DROP TRIGGER IF EXISTS create_payment_notification_trigger ON public.orders;
DROP FUNCTION IF EXISTS public.create_payment_notification();

-- 3) Helpful index for UI reads (bell dropdown)
CREATE INDEX IF NOT EXISTS idx_notifications_store_id_created_at
  ON public.notifications (store_id, created_at DESC);
