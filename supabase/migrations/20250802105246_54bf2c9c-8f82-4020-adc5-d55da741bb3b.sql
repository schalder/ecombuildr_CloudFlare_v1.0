-- Insert default theme templates that match the user's reference images

-- Fresh Organic Theme
INSERT INTO public.theme_templates (
  name, 
  slug, 
  description, 
  is_premium, 
  is_active,
  config,
  sections
) VALUES (
  'Fresh Organic',
  'fresh-organic',
  'Perfect for organic stores, farms, and natural product businesses. Features green color scheme and organic design elements.',
  false,
  true,
  '{
    "colors": {
      "primary": "#059669",
      "secondary": "#065F46", 
      "accent": "#10B981",
      "background": "#F0FDF4",
      "text": "#064E3B"
    },
    "typography": {
      "heading": "Merriweather",
      "body": "Open Sans"
    },
    "spacing": {
      "sections": "large"
    }
  }'::jsonb,
  '[
    {
      "type": "hero_organic",
      "content": {
        "title": "Fresh Organic Products",
        "subtitle": "Discover the finest organic produce, locally sourced and sustainably grown for your healthy lifestyle.",
        "cta": "Shop Fresh",
        "background": "gradient",
        "layout": "left",
        "showImage": true
      }
    },
    {
      "type": "category_showcase",
      "content": {
        "title": "Shop by Category",
        "layout": "grid",
        "showDescription": true,
        "selectedCategories": []
      }
    },
    {
      "type": "featured_products",
      "content": {
        "title": "Featured Organic Products",
        "limit": 8,
        "layout": "grid",
        "showPrice": true,
        "selectedProducts": []
      }
    },
    {
      "type": "newsletter",
      "content": {
        "title": "Stay Fresh with Our Newsletter",
        "subtitle": "Get weekly updates on new organic arrivals and special offers",
        "placeholder": "Enter your email",
        "buttonText": "Subscribe"
      }
    }
  ]'::jsonb
);

-- Tech Modern Theme  
INSERT INTO public.theme_templates (
  name,
  slug,
  description,
  is_premium,
  is_active,
  config,
  sections
) VALUES (
  'Tech Modern',
  'tech-modern',
  'Sleek and modern design perfect for electronics, gadgets, and tech products. Clean lines and professional layout.',
  false,
  true,
  '{
    "colors": {
      "primary": "#3B82F6",
      "secondary": "#1E40AF",
      "accent": "#8B5CF6", 
      "background": "#F8FAFC",
      "text": "#1E293B"
    },
    "typography": {
      "heading": "Inter",
      "body": "Inter"
    },
    "spacing": {
      "sections": "medium"
    }
  }'::jsonb,
  '[
    {
      "type": "hero_tech",
      "content": {
        "title": "Next-Gen Technology",
        "subtitle": "Discover cutting-edge gadgets and electronics that will transform your digital lifestyle.",
        "cta": "Explore Tech",
        "background": "gradient",
        "layout": "center",
        "showImage": true
      }
    },
    {
      "type": "featured_products", 
      "content": {
        "title": "Featured Tech Products",
        "limit": 6,
        "layout": "grid",
        "showPrice": true,
        "selectedProducts": []
      }
    },
    {
      "type": "values_section",
      "content": {
        "title": "Why Choose Us",
        "values": [
          {
            "title": "Latest Technology",
            "description": "We stock the newest and most innovative tech products"
          },
          {
            "title": "Expert Support", 
            "description": "Our tech experts are here to help you make the right choice"
          },
          {
            "title": "Fast Shipping",
            "description": "Get your tech delivered quickly and safely"
          }
        ]
      }
    },
    {
      "type": "newsletter",
      "content": {
        "title": "Tech News & Updates",
        "subtitle": "Be the first to know about new arrivals and exclusive tech deals",
        "placeholder": "Your email address",
        "buttonText": "Get Updates"
      }
    }
  ]'::jsonb
);