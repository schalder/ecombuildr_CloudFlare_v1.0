
-- 1) Remove duplicate triggers on stores insert that cause double execution
DROP TRIGGER IF EXISTS create_store_pages_trigger ON public.stores;
DROP TRIGGER IF EXISTS create_default_pages_trigger ON public.stores;
DROP TRIGGER IF EXISTS create_default_navigation_trigger ON public.stores;
DROP TRIGGER IF EXISTS create_navigation_trigger ON public.stores;

-- 2) Make create_default_pages idempotent with ON CONFLICT
CREATE OR REPLACE FUNCTION public.create_default_pages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  home_content     jsonb;
  products_content jsonb;
  about_content    jsonb;
  contact_content  jsonb;
  privacy_content  jsonb;
  terms_content    jsonb;
  shipping_content jsonb;
  returns_content  jsonb;
BEGIN
  -- Build JSON safely
  home_content := jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object(
        'type', 'hero',
        'content', jsonb_build_object(
          'title',    'Welcome to ' || NEW.name,
          'subtitle', 'Discover amazing products',
          'cta',      'Shop Now'
        )
      ),
      jsonb_build_object(
        'type', 'featured_products',
        'content', jsonb_build_object(
          'title', 'Featured Products',
          'limit', 8
        )
      ),
      jsonb_build_object(
        'type', 'about',
        'content', jsonb_build_object(
          'title', 'About Us',
          'text',  'We are passionate about providing quality products to our customers.'
        )
      )
    )
  );

  products_content := jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object(
        'type', 'products_grid',
        'content', jsonb_build_object(
          'title',        'All Products',
          'show_filters', true,
          'show_search',  true
        )
      )
    )
  );

  about_content := jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object(
        'type', 'content',
        'content', jsonb_build_object(
          'title', 'About ' || NEW.name,
          'text',  'We are a dedicated team committed to bringing you the best products and customer service. Our mission is to provide quality products that enhance your life.',
          'image', ''
        )
      )
    )
  );

  contact_content := jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object(
        'type', 'contact_form',
        'content', jsonb_build_object(
          'title', 'Contact Us',
          'text',  'We would love to hear from you. Send us a message and we will respond as soon as possible.',
          'email', '',
          'phone', '',
          'address', ''
        )
      )
    )
  );

  privacy_content := jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object(
        'type', 'content',
        'content', jsonb_build_object(
          'title', 'Privacy Policy',
          'text',  'This privacy policy outlines how we collect, use, and protect your personal information when you use our website and services. We are committed to protecting your privacy and ensuring your personal information is handled responsibly.'
        )
      )
    )
  );

  terms_content := jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object(
        'type', 'content',
        'content', jsonb_build_object(
          'title', 'Terms of Service',
          'text',  'These terms of service govern your use of our website and services. By using our website, you agree to these terms. Please read them carefully.'
        )
      )
    )
  );

  shipping_content := jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object(
        'type', 'content',
        'content', jsonb_build_object(
          'title', 'Shipping Information',
          'text',  'We offer fast and reliable shipping options to get your products to you quickly. Standard shipping typically takes 3-5 business days, with express options available.'
        )
      )
    )
  );

  returns_content := jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object(
        'type', 'content',
        'content', jsonb_build_object(
          'title', 'Returns & Refunds',
          'text',  'We want you to be completely satisfied with your purchase. If you are not happy with your order, you can return it within 30 days for a full refund.'
        )
      )
    )
  );

  -- Idempotent inserts: avoid duplicate key errors if called twice
  INSERT INTO public.pages (store_id, title, slug, content, is_published, is_homepage, seo_title, seo_description)
  VALUES (NEW.id, 'Home', '', home_content, true, true,
          NEW.name || ' - Quality Products Online',
          'Shop the best products at ' || NEW.name || '. Quality guaranteed, fast shipping.')
  ON CONFLICT (store_id, slug) DO NOTHING;

  INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
  VALUES (NEW.id, 'Products', 'products', products_content, true,
          'Products - ' || NEW.name,
          'Browse all products available at ' || NEW.name)
  ON CONFLICT (store_id, slug) DO NOTHING;

  INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
  VALUES (NEW.id, 'About Us', 'about', about_content, true,
          'About Us - ' || NEW.name,
          'Learn more about ' || NEW.name || ' and our commitment to quality.')
  ON CONFLICT (store_id, slug) DO NOTHING;

  INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
  VALUES (NEW.id, 'Contact', 'contact', contact_content, true,
          'Contact Us - ' || NEW.name,
          'Get in touch with ' || NEW.name || '. We are here to help.')
  ON CONFLICT (store_id, slug) DO NOTHING;

  INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
  VALUES (NEW.id, 'Privacy Policy', 'privacy', privacy_content, true,
          'Privacy Policy - ' || NEW.name,
          'Privacy policy for ' || NEW.name)
  ON CONFLICT (store_id, slug) DO NOTHING;

  INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
  VALUES (NEW.id, 'Terms of Service', 'terms', terms_content, true,
          'Terms of Service - ' || NEW.name,
          'Terms of service for ' || NEW.name)
  ON CONFLICT (store_id, slug) DO NOTHING;

  INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
  VALUES (NEW.id, 'Shipping Information', 'shipping', shipping_content, true,
          'Shipping Information - ' || NEW.name,
          'Shipping and delivery information for ' || NEW.name)
  ON CONFLICT (store_id, slug) DO NOTHING;

  INSERT INTO public.pages (store_id, title, slug, content, is_published, seo_title, seo_description)
  VALUES (NEW.id, 'Returns & Refunds', 'returns', returns_content, true,
          'Returns & Refunds - ' || NEW.name,
          'Return and refund policy for ' || NEW.name)
  ON CONFLICT (store_id, slug) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 3) Make create_default_navigation idempotent (skip if already present)
CREATE OR REPLACE FUNCTION public.create_default_navigation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Header menu
  IF NOT EXISTS (
    SELECT 1 FROM public.navigation_menus
    WHERE store_id = NEW.id AND position = 'header'
  ) THEN
    INSERT INTO public.navigation_menus (store_id, name, position, items)
    VALUES (
      NEW.id,
      'Header Menu',
      'header',
      '[
        {"label": "Home", "url": "/", "type": "page"},
        {"label": "Products", "url": "/products", "type": "page"},
        {"label": "About", "url": "/about", "type": "page"},
        {"label": "Contact", "url": "/contact", "type": "page"}
      ]'::jsonb
    );
  END IF;

  -- Footer menu
  IF NOT EXISTS (
    SELECT 1 FROM public.navigation_menus
    WHERE store_id = NEW.id AND position = 'footer'
  ) THEN
    INSERT INTO public.navigation_menus (store_id, name, position, items)
    VALUES (
      NEW.id,
      'Footer Menu',
      'footer',
      '[
        {"label": "Privacy Policy", "url": "/privacy", "type": "page"},
        {"label": "Terms of Service", "url": "/terms", "type": "page"},
        {"label": "Shipping Info", "url": "/shipping", "type": "page"},
        {"label": "Returns", "url": "/returns", "type": "page"}
      ]'::jsonb
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- 4) Ensure only the canonical triggers remain
DROP TRIGGER IF EXISTS trg_create_default_pages ON public.stores;
CREATE TRIGGER trg_create_default_pages
AFTER INSERT ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.create_default_pages();

DROP TRIGGER IF EXISTS trg_create_default_navigation ON public.stores;
CREATE TRIGGER trg_create_default_navigation
AFTER INSERT ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.create_default_navigation();
