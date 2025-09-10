-- Create atomic reorder function for funnel steps
CREATE OR REPLACE FUNCTION public.reorder_funnel_steps(step_ids uuid[], new_orders integer[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i integer;
  step_id uuid;
  new_order integer;
BEGIN
  -- Validate arrays have same length
  IF array_length(step_ids, 1) != array_length(new_orders, 1) THEN
    RAISE EXCEPTION 'Arrays must have the same length';
  END IF;

  -- Update all steps in a single transaction
  FOR i IN 1..array_length(step_ids, 1) LOOP
    step_id := step_ids[i];
    new_order := new_orders[i];
    
    UPDATE public.funnel_steps 
    SET step_order = new_order, updated_at = now()
    WHERE id = step_id;
  END LOOP;
END;
$$;