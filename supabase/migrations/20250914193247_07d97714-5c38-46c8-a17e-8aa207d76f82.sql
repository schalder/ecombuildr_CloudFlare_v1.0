-- Create domain connection for the new-page-test page using website content type
INSERT INTO domain_connections (
  content_type,
  content_id,
  domain_id,
  path,
  is_homepage,
  store_id
) VALUES (
  'website',
  'b109aee2-0b65-4b85-8dd2-8f6448df6c79',
  '934f18b8-7b75-4f02-b436-262bfe061df9',
  '/new-page-test',
  false,
  'b011b5b7-07f7-4ce6-a1f6-c5e56adce070'
) ON CONFLICT DO NOTHING;