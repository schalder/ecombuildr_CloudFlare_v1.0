-- Add unique constraint on session_id for proper deduplication in Edge Function
-- This allows upsert to work correctly based on session_id

-- First, check if there are any duplicate session_ids
-- If there are, we'll need to clean them up first
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT session_id, COUNT(*) as cnt
    FROM public.incomplete_checkouts
    WHERE session_id IS NOT NULL
    GROUP BY session_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    -- Delete duplicates, keeping only the most recent one
    DELETE FROM public.incomplete_checkouts
    WHERE id IN (
      SELECT id
      FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at DESC) as rn
        FROM public.incomplete_checkouts
        WHERE session_id IS NOT NULL
      ) ranked
      WHERE rn > 1
    );
  END IF;
END $$;

-- Now add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_incomplete_checkouts_session_id_unique 
ON public.incomplete_checkouts(session_id) 
WHERE session_id IS NOT NULL;
