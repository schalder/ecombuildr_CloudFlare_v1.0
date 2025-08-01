-- Update navigation menu items to use full storefront URLs
UPDATE navigation_menus 
SET items = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        items,
        '{0,url}', 
        '""'
      ),
      '{1,url}', 
      '"/products"'
    ),
    '{2,url}', 
    '"/about"'
  ),
  '{3,url}', 
  '"/contact"'
)
WHERE position = 'header';

UPDATE navigation_menus 
SET items = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        items,
        '{0,url}', 
        '"/privacy"'
      ),
      '{1,url}', 
      '"/terms"'
    ),
    '{2,url}', 
    '"/shipping"'
  ),
  '{3,url}', 
  '"/returns"'
)
WHERE position = 'footer';