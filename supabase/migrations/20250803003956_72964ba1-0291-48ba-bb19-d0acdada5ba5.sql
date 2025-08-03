-- Insert the "Fresh Organic Complete" template with exact layout sections
INSERT INTO theme_templates (
  name,
  slug,
  description,
  is_premium,
  preview_image,
  config,
  sections
) VALUES (
  'Fresh Organic Complete',
  'fresh-organic-complete',
  'Complete organic grocery store theme with promotional banners, category navigation, and weekly bestsellers',
  false,
  '/templates/fresh-organic-complete.jpg',
  '{
    "primaryColor": "#16a34a",
    "secondaryColor": "#059669",
    "accentColor": "#fbbf24",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937",
    "fontFamily": "Inter",
    "headerStyle": "clean",
    "buttonStyle": "rounded",
    "cardStyle": "soft-shadow"
  }'::jsonb,
  '[
    {
      "id": "promo-banner-1",
      "type": "promo_banner",
      "content": {
        "title": "Amazing Deals Don'\''t Miss!",
        "subtitle": "Get up to 50% off on fresh organic products",
        "cta": "Shop Now",
        "ctaUrl": "/products",
        "background": "gradient",
        "style": "bold",
        "showIcon": true
      }
    },
    {
      "id": "category-circles-1",
      "type": "theme/category-circles",
      "content": {
        "title": "Shop by Category",
        "subtitle": "Browse our fresh organic selection",
        "layout": "circles",
        "showAll": false,
        "customCategories": [
          {
            "id": "organic-fruits",
            "name": "Organic Fruits",
            "image": "",
            "color": "#ef4444"
          },
          {
            "id": "vegetables",
            "name": "Vegetables",
            "image": "",
            "color": "#22c55e"
          },
          {
            "id": "dairy",
            "name": "Dairy",
            "image": "",
            "color": "#3b82f6"
          },
          {
            "id": "meat",
            "name": "Meat",
            "image": "",
            "color": "#f59e0b"
          },
          {
            "id": "bakery",
            "name": "Bakery",
            "image": "",
            "color": "#8b5cf6"
          },
          {
            "id": "beverages",
            "name": "Beverages",
            "image": "",
            "color": "#06b6d4"
          }
        ]
      }
    },
    {
      "id": "weekly-featured-1",
      "type": "theme/weekly-featured",
      "content": {
        "title": "Weekly Best Selling Organic Items",
        "subtitle": "Top picks from our customers this week",
        "layout": "grid",
        "showBadge": true,
        "badgeText": "WEEKLY PICK",
        "limit": 8,
        "showDescription": false
      }
    },
    {
      "id": "modern-product-grid-1",
      "type": "modern_product_grid",
      "content": {
        "title": "Featured Products",
        "subtitle": "Hand-picked organic products for you",
        "columns": 4,
        "limit": 12,
        "showRating": true,
        "showQuickAdd": true,
        "showWishlist": true,
        "showStock": true
      }
    },
    {
      "id": "values-section-1",
      "type": "values_section",
      "content": {
        "title": "Why Choose Our Organic Products?",
        "subtitle": "Quality you can trust, delivered fresh to your door",
        "values": [
          {
            "title": "100% Organic",
            "description": "Certified organic products without harmful chemicals",
            "icon": "leaf"
          },
          {
            "title": "Farm Fresh",
            "description": "Delivered fresh from local organic farms",
            "icon": "truck"
          },
          {
            "title": "Quality Assured",
            "description": "Every product meets our strict quality standards",
            "icon": "shield"
          }
        ]
      }
    },
    {
      "id": "newsletter-1",
      "type": "newsletter",
      "content": {
        "title": "Stay Updated",
        "subtitle": "Get the latest deals and organic living tips",
        "placeholder": "Enter your email address",
        "buttonText": "Subscribe",
        "showPrivacyText": true
      }
    }
  ]'::jsonb
);