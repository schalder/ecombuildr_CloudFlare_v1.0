-- Insert Fresh Organic Store theme template
INSERT INTO theme_templates (name, slug, description, config, sections, is_premium, is_active) VALUES 
(
  'Fresh Organic Market',
  'fresh-organic-market',
  'A warm, natural design perfect for organic grocery stores, farmers markets, and wellness brands with fresh produce showcases',
  '{
    "colors": {
      "primary": "#16a34a",
      "secondary": "#15803d",
      "accent": "#84cc16",
      "background": "#ffffff",
      "text": "#166534"
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
      "type": "fresh_organic_hero",
      "content": {
        "title": "Farm Fresh Organic",
        "subtitle": "Discover the finest organic produce, delivered fresh from local farms to your doorstep. Pure, natural, and sustainably grown.",
        "ctaPrimary": "Shop Fresh Now",
        "ctaSecondary": "Learn More", 
        "backgroundImage": "",
        "showSearch": true,
        "searchPlaceholder": "Search organic products..."
      }
    },
    {
      "type": "modern_product_grid",
      "content": {
        "title": "Fresh Picks Today",
        "subtitle": "Hand-selected organic produce from local farms",
        "columns": 4,
        "showRating": true,
        "showQuickAdd": true,
        "showWishlist": false,
        "showStock": true,
        "limit": 8
      }
    },
    {
      "type": "category_circles",
      "content": {
        "title": "Shop by Category",
        "subtitle": "Fresh, organic, and sustainably sourced",
        "layout": "circles",
        "showAll": true
      }
    },
    {
      "type": "values_section",
      "content": {
        "title": "Our Promise",
        "items": [
          {
            "title": "100% Organic",
            "description": "Certified organic ingredients, no pesticides or chemicals"
          },
          {
            "title": "Farm Fresh",
            "description": "Sourced directly from local organic farms"
          },
          {
            "title": "Sustainable",
            "description": "Eco-friendly packaging and sustainable farming practices"
          }
        ]
      }
    },
    {
      "type": "newsletter",
      "content": {
        "title": "Fresh Updates",
        "subtitle": "Get weekly organic produce updates and healthy recipes",
        "placeholder": "Enter your email for fresh updates",
        "buttonText": "Join Community"
      }
    }
  ]'::jsonb,
  false,
  true
);