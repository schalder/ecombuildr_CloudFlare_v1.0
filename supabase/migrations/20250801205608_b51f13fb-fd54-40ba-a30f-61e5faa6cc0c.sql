-- First, let's check if the trigger exists and is working
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'create_store_pages_trigger';

-- Fix the create_default_pages function to ensure it works properly
CREATE OR REPLACE FUNCTION public.create_default_pages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Create homepage
  INSERT INTO public.pages (store_id, title, slug, content, is_published, is_homepage, seo_title, seo_description)
  VALUES (
    NEW.id,
    'Home',
    '',
    '{"sections": [{"type": "hero", "content": {"title": "Welcome to ' || NEW.name || '", "subtitle": "Discover amazing products", "cta": "Shop Now"}}, {"type": "featured_products", "content": {"title": "Featured Products", "limit": 8}}, {"type": "about", "content": {"title": "About Us", "text": "We are passionate about providing quality products to our customers."}}]}'::jsonb,
    true,
    true,
    NEW.name || ' - Quality Products Online',
    'Shop the best products at ' || NEW.name || '. Quality guaranteed, fast shipping.'
  );

  -- Create products page
  INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
  VALUES (
    NEW.id,
    'Products',
    'products',
    '{"sections": [{"type": "products_grid", "content": {"title": "All Products", "show_filters": true, "show_search": true}}]}'::jsonb,
    true,
    'Products - ' || NEW.name,
    'Browse all products available at ' || NEW.name
  );

  -- Create about page
  INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
  VALUES (
    NEW.id,
    'About Us',
    'about',
    '{"sections": [{"type": "content", "content": {"title": "About ' || NEW.name || '", "text": "We are a dedicated team committed to bringing you the best products and customer service. Our mission is to provide quality products that enhance your life.", "image": ""}}]}'::jsonb,
    true,
    'About Us - ' || NEW.name,
    'Learn more about ' || NEW.name || ' and our commitment to quality.'
  );

  -- Create contact page
  INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
  VALUES (
    NEW.id,
    'Contact',
    'contact',
    '{"sections": [{"type": "contact_form", "content": {"title": "Contact Us", "text": "We would love to hear from you. Send us a message and we will respond as soon as possible.", "email": "", "phone": "", "address": ""}}]}'::jsonb,
    true,
    'Contact Us - ' || NEW.name,
    'Get in touch with ' || NEW.name || '. We are here to help.'
  );

  -- Create privacy policy page
  INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
  VALUES (
    NEW.id,
    'Privacy Policy',
    'privacy',
    '{"sections": [{"type": "content", "content": {"title": "Privacy Policy", "text": "This privacy policy outlines how we collect, use, and protect your personal information when you use our website and services. We are committed to protecting your privacy and ensuring your personal information is handled responsibly."}}]}'::jsonb,
    true,
    'Privacy Policy - ' || NEW.name,
    'Privacy policy for ' || NEW.name
  );

  -- Create terms of service page
  INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
  VALUES (
    NEW.id,
    'Terms of Service',
    'terms',
    '{"sections": [{"type": "content", "content": {"title": "Terms of Service", "text": "These terms of service govern your use of our website and services. By using our website, you agree to these terms. Please read them carefully."}}]}'::jsonb,
    true,
    'Terms of Service - ' || NEW.name,
    'Terms of service for ' || NEW.name
  );

  -- Create shipping information page
  INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
  VALUES (
    NEW.id,
    'Shipping Information',
    'shipping',
    '{"sections": [{"type": "content", "content": {"title": "Shipping Information", "text": "We offer fast and reliable shipping options to get your products to you quickly. Standard shipping typically takes 3-5 business days, with express options available."}}]}'::jsonb,
    true,
    'Shipping Information - ' || NEW.name,
    'Shipping and delivery information for ' || NEW.name
  );

  -- Create returns page
  INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
  VALUES (
    NEW.id,
    'Returns & Refunds',
    'returns',
    '{"sections": [{"type": "content", "content": {"title": "Returns & Refunds", "text": "We want you to be completely satisfied with your purchase. If you are not happy with your order, you can return it within 30 days for a full refund."}}]}'::jsonb,
    true,
    'Returns & Refunds - ' || NEW.name,
    'Return and refund policy for ' || NEW.name
  );

  RETURN NEW;
END;
$function$;

-- Recreate the trigger to ensure it's working
DROP TRIGGER IF EXISTS create_store_pages_trigger ON public.stores;
CREATE TRIGGER create_store_pages_trigger
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_pages();

-- Now manually create the missing 7 pages for the existing store
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
      '{"sections": [{"type": "products_grid", "content": {"title": "All Products", "show_filters": true, "show_search": true}}]}'::jsonb,
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
      '{"sections": [{"type": "content", "content": {"title": "About ' || store_record.name || '", "text": "We are a dedicated team committed to bringing you the best products and customer service. Our mission is to provide quality products that enhance your life.", "image": ""}}]}'::jsonb,
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
      '{"sections": [{"type": "contact_form", "content": {"title": "Contact Us", "text": "We would love to hear from you. Send us a message and we will respond as soon as possible.", "email": "", "phone": "", "address": ""}}]}'::jsonb,
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
      '{"sections": [{"type": "content", "content": {"title": "Privacy Policy", "text": "This privacy policy outlines how we collect, use, and protect your personal information when you use our website and services. We are committed to protecting your privacy and ensuring your personal information is handled responsibly."}}]}'::jsonb,
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
      '{"sections": [{"type": "content", "content": {"title": "Terms of Service", "text": "These terms of service govern your use of our website and services. By using our website, you agree to these terms. Please read them carefully."}}]}'::jsonb,
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
      '{"sections": [{"type": "content", "content": {"title": "Shipping Information", "text": "We offer fast and reliable shipping options to get your products to you quickly. Standard shipping typically takes 3-5 business days, with express options available."}}]}'::jsonb,
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
      '{"sections": [{"type": "content", "content": {"title": "Returns & Refunds", "text": "We want you to be completely satisfied with your purchase. If you are not happy with your order, you can return it within 30 days for a full refund."}}]}'::jsonb,
      true,
      'Returns & Refunds - ' || store_record.name,
      'Return and refund policy for ' || store_record.name
    );
  END IF;
END;
$$;