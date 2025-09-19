-- Secure cascade delete for course order + related member data
CREATE OR REPLACE FUNCTION public.delete_course_order_cascade(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_store_id uuid;
  v_member_account_ids uuid[];
BEGIN
  -- Verify ownership or super admin
  SELECT s.id INTO v_store_id
  FROM public.course_orders o
  JOIN public.courses c ON c.id = o.course_id
  JOIN public.stores s ON s.id = c.store_id
  WHERE o.id = p_order_id;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF NOT (public.is_store_owner(v_store_id) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Collect member accounts linked to this order
  SELECT array_agg(DISTINCT member_account_id)
  INTO v_member_account_ids
  FROM public.course_member_access
  WHERE course_order_id = p_order_id AND member_account_id IS NOT NULL;

  -- Delete dependent rows first
  DELETE FROM public.member_content_access WHERE course_order_id = p_order_id;
  DELETE FROM public.course_member_access WHERE course_order_id = p_order_id;

  -- Delete member accounts captured (full student removal)
  IF v_member_account_ids IS NOT NULL AND array_length(v_member_account_ids,1) > 0 THEN
    DELETE FROM public.member_accounts WHERE id = ANY(v_member_account_ids);
  END IF;

  -- Finally delete the order itself
  DELETE FROM public.course_orders WHERE id = p_order_id;
END;
$$;