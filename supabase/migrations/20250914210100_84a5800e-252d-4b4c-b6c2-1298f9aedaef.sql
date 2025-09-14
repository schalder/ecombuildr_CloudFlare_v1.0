-- Remove the demo store 'communityhq' and all its related data
-- This store is no longer needed as we've shifted to a website/funnel-centric approach

-- First, get the store ID for reference
DO $$
DECLARE
    demo_store_id uuid;
BEGIN
    -- Get the store ID
    SELECT id INTO demo_store_id FROM public.stores WHERE slug = 'communityhq';
    
    IF demo_store_id IS NOT NULL THEN
        -- Delete related data in correct order to avoid foreign key constraints
        
        -- Delete form submissions
        DELETE FROM public.form_submissions WHERE store_id = demo_store_id;
        
        -- Delete order items first, then orders
        DELETE FROM public.order_items WHERE order_id IN (
            SELECT id FROM public.orders WHERE store_id = demo_store_id
        );
        DELETE FROM public.orders WHERE store_id = demo_store_id;
        
        -- Delete customer addresses and customers
        DELETE FROM public.customer_addresses WHERE customer_id IN (
            SELECT id FROM public.customers WHERE store_id = demo_store_id
        );
        DELETE FROM public.customers WHERE store_id = demo_store_id;
        
        -- Delete product reviews
        DELETE FROM public.product_reviews WHERE store_id = demo_store_id;
        
        -- Delete product collection items and collections
        DELETE FROM public.product_collection_items WHERE collection_id IN (
            SELECT id FROM public.collections WHERE website_id IN (
                SELECT id FROM public.websites WHERE store_id = demo_store_id
            )
        );
        DELETE FROM public.collections WHERE website_id IN (
            SELECT id FROM public.websites WHERE store_id = demo_store_id
        );
        
        -- Delete product website visibility
        DELETE FROM public.product_website_visibility WHERE website_id IN (
            SELECT id FROM public.websites WHERE store_id = demo_store_id
        );
        DELETE FROM public.product_website_visibility WHERE product_id IN (
            SELECT id FROM public.products WHERE store_id = demo_store_id
        );
        
        -- Delete category website visibility and categories
        DELETE FROM public.category_website_visibility WHERE website_id IN (
            SELECT id FROM public.websites WHERE store_id = demo_store_id
        );
        DELETE FROM public.category_website_visibility WHERE category_id IN (
            SELECT id FROM public.categories WHERE store_id = demo_store_id
        );
        DELETE FROM public.categories WHERE store_id = demo_store_id;
        
        -- Delete products
        DELETE FROM public.products WHERE store_id = demo_store_id;
        
        -- Delete website pages, websites, funnel steps, and funnels
        DELETE FROM public.website_pages WHERE website_id IN (
            SELECT id FROM public.websites WHERE store_id = demo_store_id
        );
        DELETE FROM public.websites WHERE store_id = demo_store_id;
        
        DELETE FROM public.funnel_steps WHERE funnel_id IN (
            SELECT id FROM public.funnels WHERE store_id = demo_store_id
        );
        DELETE FROM public.funnels WHERE store_id = demo_store_id;
        
        -- Delete pages and navigation menus
        DELETE FROM public.pages WHERE store_id = demo_store_id;
        DELETE FROM public.navigation_menus WHERE store_id = demo_store_id;
        
        -- Delete pixel events and notifications
        DELETE FROM public.pixel_events WHERE store_id = demo_store_id;
        DELETE FROM public.notifications WHERE store_id = demo_store_id;
        
        -- Delete cart sessions
        DELETE FROM public.cart_sessions WHERE store_id = demo_store_id;
        
        -- Finally delete the store itself
        DELETE FROM public.stores WHERE id = demo_store_id;
        
        RAISE NOTICE 'Demo store "communityhq" and all related data have been deleted';
    ELSE
        RAISE NOTICE 'Demo store "communityhq" not found';
    END IF;
END $$;