-- Create the missing 7 pages for the existing store with properly escaped JSON
DO $$
DECLARE
  store_record RECORD;
BEGIN
  -- Get the existing store
  SELECT * INTO store_record FROM public.stores LIMIT 1;
  
  IF store_record.id IS NOT NULL THEN
    -- Create products page
    INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
    VALUES (
      store_record.id,
      'Products',
      'products',
      '{"sections": [{"type": "products_grid", "content": {"title": "All Products", "show_filters": true, "show_search": true}}]}',
      true,
      'Products - ' || store_record.name,
      'Browse all products available at ' || store_record.name
    );

    -- Create about page
    INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
    VALUES (
      store_record.id,
      'About Us',
      'about',
      '{"sections": [{"type": "content", "content": {"title": "About Us", "text": "We are a dedicated team committed to bringing you the best products and customer service. Our mission is to provide quality products that enhance your life.", "image": ""}}]}',
      true,
      'About Us - ' || store_record.name,
      'Learn more about ' || store_record.name || ' and our commitment to quality.'
    );

    -- Create contact page
    INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
    VALUES (
      store_record.id,
      'Contact',
      'contact',
      '{"sections": [{"type": "contact_form", "content": {"title": "Contact Us", "text": "We would love to hear from you. Send us a message and we will respond as soon as possible.", "email": "", "phone": "", "address": ""}}]}',
      true,
      'Contact Us - ' || store_record.name,
      'Get in touch with ' || store_record.name || '. We are here to help.'
    );

    -- Create privacy policy page
    INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
    VALUES (
      store_record.id,
      'Privacy Policy',
      'privacy',
      '{"sections": [{"type": "content", "content": {"title": "Privacy Policy", "text": "This privacy policy outlines how we collect, use, and protect your personal information when you use our website and services. We are committed to protecting your privacy and ensuring your personal information is handled responsibly."}}]}',
      true,
      'Privacy Policy - ' || store_record.name,
      'Privacy policy for ' || store_record.name
    );

    -- Create terms of service page
    INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
    VALUES (
      store_record.id,
      'Terms of Service',
      'terms',
      '{"sections": [{"type": "content", "content": {"title": "Terms of Service", "text": "These terms of service govern your use of our website and services. By using our website, you agree to these terms. Please read them carefully."}}]}',
      true,
      'Terms of Service - ' || store_record.name,
      'Terms of service for ' || store_record.name
    );

    -- Create shipping information page
    INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
    VALUES (
      store_record.id,
      'Shipping Information',
      'shipping',
      '{"sections": [{"type": "content", "content": {"title": "Shipping Information", "text": "We offer fast and reliable shipping options to get your products to you quickly. Standard shipping typically takes 3-5 business days, with express options available."}}]}',
      true,
      'Shipping Information - ' || store_record.name,
      'Shipping and delivery information for ' || store_record.name
    );

    -- Create returns page
    INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
    VALUES (
      store_record.id,
      'Returns & Refunds',
      'returns',
      '{"sections": [{"type": "content", "content": {"title": "Returns & Refunds", "text": "We want you to be completely satisfied with your purchase. If you are not happy with your order, you can return it within 30 days for a full refund."}}]}',
      true,
      'Returns & Refunds - ' || store_record.name,
      'Return and refund policy for ' || store_record.name
    );
  END IF;
END;
$$;