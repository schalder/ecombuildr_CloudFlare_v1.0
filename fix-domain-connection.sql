-- Domain Connection Fix Script
-- Run this in Supabase SQL Editor to diagnose and fix the domain connection issue

-- Step 1: Check if the domain exists
SELECT 
  id,
  domain,
  store_id,
  is_verified,
  dns_configured,
  created_at
FROM custom_domains 
WHERE domain = 'store.powerkits.net';

-- Step 2: Check if there are any connections for this domain
-- (Replace 'DOMAIN_ID_HERE' with the actual domain ID from Step 1)
SELECT 
  dc.id,
  dc.content_type,
  dc.content_id,
  dc.path,
  dc.is_homepage,
  dc.created_at,
  CASE 
    WHEN dc.content_type = 'website' THEN w.name
    WHEN dc.content_type = 'funnel' THEN f.name
    ELSE 'Unknown'
  END as content_name
FROM domain_connections dc
LEFT JOIN websites w ON dc.content_type = 'website' AND dc.content_id = w.id
LEFT JOIN funnels f ON dc.content_type = 'funnel' AND dc.content_id = f.id
WHERE dc.domain_id = 'DOMAIN_ID_HERE'; -- Replace with actual domain ID

-- Step 3: Get available websites for this store
-- (Replace 'STORE_ID_HERE' with the actual store ID from Step 1)
SELECT 
  id,
  name,
  slug,
  is_active,
  created_at
FROM websites 
WHERE store_id = 'STORE_ID_HERE' -- Replace with actual store ID
  AND is_active = true
ORDER BY created_at DESC;

-- Step 4: Get available funnels for this store
-- (Replace 'STORE_ID_HERE' with the actual store ID from Step 1)
SELECT 
  id,
  name,
  slug,
  is_active,
  created_at
FROM funnels 
WHERE store_id = 'STORE_ID_HERE' -- Replace with actual store ID
  AND is_active = true
ORDER BY created_at DESC;

-- Step 5: Create a domain connection (UNCOMMENT AND MODIFY AS NEEDED)
-- This will connect the domain to a website (replace the IDs with actual values)
/*
INSERT INTO domain_connections (
  domain_id,
  store_id,
  content_type,
  content_id,
  path,
  is_homepage
) VALUES (
  'DOMAIN_ID_HERE',        -- Domain ID from Step 1
  'STORE_ID_HERE',         -- Store ID from Step 1
  'website',               -- or 'funnel'
  'WEBSITE_ID_HERE',       -- Website ID from Step 3 (or Funnel ID from Step 4)
  '/',
  true
);
*/

-- Step 6: Verify the connection was created
-- (Replace 'DOMAIN_ID_HERE' with the actual domain ID)
/*
SELECT 
  dc.id,
  dc.content_type,
  dc.content_id,
  dc.path,
  dc.is_homepage,
  CASE 
    WHEN dc.content_type = 'website' THEN w.name
    WHEN dc.content_type = 'funnel' THEN f.name
    ELSE 'Unknown'
  END as content_name
FROM domain_connections dc
LEFT JOIN websites w ON dc.content_type = 'website' AND dc.content_id = w.id
LEFT JOIN funnels f ON dc.content_type = 'funnel' AND dc.content_id = f.id
WHERE dc.domain_id = 'DOMAIN_ID_HERE';
*/
