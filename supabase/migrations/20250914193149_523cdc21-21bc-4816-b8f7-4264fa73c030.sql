-- Create domain connection for the new-page-test page
INSERT INTO domain_connections (
  content_type,
  content_id,
  domain_id,
  path,
  is_homepage,
  store_id
) VALUES (
  'website_page',
  '50966c6e-192a-4217-823c-e7a56b66a851',
  (SELECT cd.id FROM custom_domains cd JOIN websites w ON w.store_id = cd.store_id WHERE w.id = 'b109aee2-0b65-4b85-8dd2-8f6448df6c79' AND cd.domain = 'shop.powerkits.net'),
  '/new-page-test',
  false,
  'b011b5b7-07f7-4ce6-a1f6-c5e56adce070'
) ON CONFLICT DO NOTHING;