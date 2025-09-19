-- Clean up all Samir Haldar duplicate records
DO $$
DECLARE
    order_ids uuid[];
    member_account_ids uuid[];
    deleted_content_access integer := 0;
    deleted_member_access integer := 0;
    deleted_member_accounts integer := 0;
    deleted_orders integer := 0;
BEGIN
    -- Get all order IDs for Samir Haldar
    SELECT array_agg(id) INTO order_ids
    FROM course_orders 
    WHERE customer_email = 'schalder24@gmail.com';
    
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
    WHERE customer_email = 'schalder24@gmail.com';
    GET DIAGNOSTICS deleted_orders = ROW_COUNT;
    
    -- Log results
    RAISE NOTICE 'Cleanup completed:';
    RAISE NOTICE 'Deleted % course orders', deleted_orders;
    RAISE NOTICE 'Deleted % member access records', deleted_member_access;
    RAISE NOTICE 'Deleted % content access records', deleted_content_access;
    RAISE NOTICE 'Deleted % member accounts', deleted_member_accounts;
END $$;