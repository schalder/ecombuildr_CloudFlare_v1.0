-- Insert new modern VR e-commerce theme template
INSERT INTO theme_templates (name, slug, description, config, sections, is_premium, is_active) VALUES 
(
  'CommunityHQ Modern VR Store',
  'communityhq-modern-vr',
  'A modern, professional e-commerce theme designed for VR and tech products with stunning hero sections and product grids',
  '{
    "colors": {
      "primary": "#f97316",
      "secondary": "#ea580c",
      "accent": "#3b82f6",
      "background": "#ffffff",
      "text": "#1f2937"
    },
    "typography": {
      "heading": "Inter",
      "body": "Inter"
    },
    "spacing": {
      "sections": "large"
    }
  }'::jsonb,
  '[
    {
      "type": "modern_ecommerce_hero",
      "content": {
        "title": "Welcome to CommunityHQ",
        "subtitle": "Discover cutting-edge VR technology and immersive experiences that transport you to new worlds",
        "ctaPrimary": "Shop VR Collection",
        "ctaSecondary": "Watch Demo", 
        "backgroundImage": "",
        "showSearch": true,
        "searchPlaceholder": "Search for VR headsets, accessories, games..."
      }
    },
    {
      "type": "modern_product_grid",
      "content": {
        "title": "Featured VR Products",
        "subtitle": "Explore our curated selection of premium VR headsets and accessories",
        "columns": 4,
        "showRating": true,
        "showQuickAdd": true,
        "showWishlist": true,
        "showStock": true,
        "limit": 8
      }
    },
    {
      "type": "category_showcase",
      "content": {
        "title": "Shop by Category",
        "subtitle": "Find exactly what you need",
        "layout": "cards",
        "showAll": true
      }
    },
    {
      "type": "newsletter",
      "content": {
        "title": "Stay Updated",
        "subtitle": "Get the latest VR news and exclusive offers",
        "placeholder": "Enter your email address",
        "buttonText": "Subscribe Now"
      }
    }
  ]'::jsonb,
  false,
  true
);