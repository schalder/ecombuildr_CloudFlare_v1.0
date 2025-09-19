-- Bulk cleanup function to remove all records for a specific customer email
CREATE OR REPLACE FUNCTION public.bulk_delete_customer_records(customer_email_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_orders integer := 0;
  deleted_member_access integer := 0;
  deleted_content_access integer := 0;
  deleted_member_accounts integer := 0;
  order_ids uuid[];
  member_account_ids uuid[];
BEGIN
  -- Get all order IDs for this customer
  SELECT array_agg(id) INTO order_ids
  FROM course_orders 
  WHERE customer_email = customer_email_param;
  
  IF order_ids IS NULL OR array_length(order_ids, 1) = 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'No orders found for this customer'
    );
  END IF;
  
  -- Get member account IDs associated with these orders
  SELECT array_agg(DISTINCT member_account_id) 
  INTO member_account_ids
  FROM course_member_access 
  WHERE course_order_id = ANY(order_ids)
  AND member_account_id IS NOT NULL;
  
  -- Delete member content access records
  DELETE FROM member_content_access 
  WHERE course_order_id = ANY(order_ids);
  GET DIAGNOSTICS deleted_content_access = ROW_COUNT;
  
  -- Delete course member access records
  DELETE FROM course_member_access 
  WHERE course_order_id = ANY(order_ids);
  GET DIAGNOSTICS deleted_member_access = ROW_COUNT;
  
  -- Delete member accounts if they exist
  IF member_account_ids IS NOT NULL AND array_length(member_account_ids, 1) > 0 THEN
    DELETE FROM member_accounts 
    WHERE id = ANY(member_account_ids);
    GET DIAGNOSTICS deleted_member_accounts = ROW_COUNT;
  END IF;
  
  -- Delete course orders
  DELETE FROM course_orders 
  WHERE customer_email = customer_email_param;
  GET DIAGNOSTICS deleted_orders = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_orders', deleted_orders,
    'deleted_member_access', deleted_member_access,
    'deleted_content_access', deleted_content_access,
    'deleted_member_accounts', deleted_member_accounts,
    'order_ids', order_ids
  );
END;
$$;