-- Create function to reactivate websites/funnels when account is upgraded from read_only
-- This fixes the issue where users get stuck on welcome gate after upgrading

CREATE OR REPLACE FUNCTION public.reactivate_resources_on_upgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When account_status changes FROM 'read_only' TO 'active' or 'trial'
  IF tg_op = 'UPDATE'
     AND old.account_status = 'read_only'
     AND new.account_status IN ('active', 'trial')
     AND old.account_status IS DISTINCT FROM new.account_status THEN

    -- Reactivate all websites owned by this user (via their stores)
    UPDATE public.websites w
    SET is_active = true
    FROM public.stores s
    WHERE w.store_id = s.id
      AND s.owner_id = new.id
      AND w.is_active = false;

    -- Reactivate all funnels owned by this user (via their stores)
    UPDATE public.funnels f
    SET is_active = true
    FROM public.stores s
    WHERE f.store_id = s.id
      AND s.owner_id = new.id
      AND f.is_active = false;
  END IF;

  RETURN new;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_reactivate_resources_on_upgrade ON public.profiles;

CREATE TRIGGER trg_reactivate_resources_on_upgrade
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.reactivate_resources_on_upgrade();

-- Backfill: Reactivate resources for existing active/trial accounts that have inactive resources
-- This is a safety measure for accounts that were upgraded before this trigger existed

-- Reactivate websites for active/trial accounts with inactive websites
UPDATE public.websites w
SET is_active = true
FROM public.stores s, public.profiles p
WHERE w.store_id = s.id
  AND s.owner_id = p.id
  AND p.account_status IN ('active', 'trial')
  AND w.is_active = false;

-- Reactivate funnels for active/trial accounts with inactive funnels
UPDATE public.funnels f
SET is_active = true
FROM public.stores s, public.profiles p
WHERE f.store_id = s.id
  AND s.owner_id = p.id
  AND p.account_status IN ('active', 'trial')
  AND f.is_active = false;

