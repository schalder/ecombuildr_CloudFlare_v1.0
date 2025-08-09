-- Fix enum resolution by fully-qualifying type in trigger function and trigger
-- 1) Recreate function with schema-qualified enum
CREATE OR REPLACE FUNCTION public.adjust_inventory_on_order_delivered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only proceed on first transition to 'delivered'
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'delivered'::public.order_status
     AND (OLD.status IS DISTINCT FROM 'delivered'::public.order_status) THEN

    -- Deduct inventory for tracked products based on order items
    UPDATE public.products AS p
    SET inventory_quantity = GREATEST(0, p.inventory_quantity - oi.qty)
    FROM (
      SELECT product_id, SUM(quantity)::int AS qty
      FROM public.order_items
      WHERE order_id = NEW.id
      GROUP BY product_id
    ) AS oi
    WHERE p.id = oi.product_id
      AND COALESCE(p.track_inventory, false) = true;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) Recreate trigger with schema-qualified enum
DROP TRIGGER IF EXISTS trg_adjust_inventory_on_delivery ON public.orders;

CREATE TRIGGER trg_adjust_inventory_on_delivery
AFTER UPDATE ON public.orders
FOR EACH ROW
WHEN (
  NEW.status = 'delivered'::public.order_status AND 
  (OLD.status IS DISTINCT FROM 'delivered'::public.order_status)
)
EXECUTE FUNCTION public.adjust_inventory_on_order_delivered();