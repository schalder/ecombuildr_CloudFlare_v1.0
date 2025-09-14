-- Create domain connection for the new-page-test page
INSERT INTO domain_connections (
  content_type,
  content_id,
  custom_domain,
  path,
  is_active
) VALUES (
  'website_page',
  '50966c6e-192a-4217-823c-e7a56b66a851',
  'shop.powerkits.net',
  '/new-page-test',
  true
) ON CONFLICT DO NOTHING;