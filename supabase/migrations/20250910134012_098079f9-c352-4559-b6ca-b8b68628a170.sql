-- Replace the reorder_funnel_steps function with a conflict-safe version
CREATE OR REPLACE FUNCTION public.reorder_funnel_steps(step_ids uuid[], new_orders integer[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_len int;
  v_funnel uuid;
BEGIN
  v_len := array_length(step_ids, 1);
  IF v_len IS NULL OR v_len <> array_length(new_orders, 1) THEN
    RAISE EXCEPTION 'Arrays must have the same length and not be empty';
  END IF;

  -- Ensure all steps belong to the same funnel (defense-in-depth)
  SELECT funnel_id INTO v_funnel FROM public.funnel_steps WHERE id = step_ids[1];
  IF EXISTS (
    SELECT 1 FROM public.funnel_steps
    WHERE id = ANY(step_ids) AND funnel_id <> v_funnel
  ) THEN
    RAISE EXCEPTION 'All steps must belong to the same funnel';
  END IF;

  -- Lock affected rows deterministically to prevent concurrent races
  PERFORM 1
  FROM public.funnel_steps
  WHERE id = ANY(step_ids)
  ORDER BY step_order
  FOR UPDATE;

  -- Temporary bump to avoid (funnel_id, step_order) unique collisions
  UPDATE public.funnel_steps
  SET step_order = step_order + 1000
  WHERE id = ANY(step_ids);

  -- Apply final ordering via a mapping table
  WITH mapping AS (
    SELECT unnest(step_ids) AS id, unnest(new_orders) AS new_order
  )
  UPDATE public.funnel_steps fs
  SET step_order = m.new_order,
      updated_at = now()
  FROM mapping m
  WHERE fs.id = m.id;

END;
$$;