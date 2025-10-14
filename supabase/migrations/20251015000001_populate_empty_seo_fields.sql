-- ============================================
-- POPULATE EMPTY SEO FIELDS FOR WEBSITE PAGES
-- ============================================

-- Set seo_title to page title if empty
UPDATE website_pages
SET seo_title = title
WHERE (seo_title IS NULL OR seo_title = '')
  AND title IS NOT NULL
  AND title != ''
  AND is_published = true;

-- Set seo_description from title if empty
UPDATE website_pages
SET seo_description = substring(title || '. Learn more on our page.', 1, 155)
WHERE (seo_description IS NULL OR seo_description = '')
  AND title IS NOT NULL
  AND title != ''
  AND is_published = true;

-- ============================================
-- POPULATE EMPTY SEO FIELDS FOR FUNNELS
-- ============================================

-- Set funnel seo_title to funnel name if empty
UPDATE funnels
SET seo_title = name
WHERE (seo_title IS NULL OR seo_title = '')
  AND name IS NOT NULL
  AND name != ''
  AND is_published = true;

-- Set funnel seo_description if empty
UPDATE funnels
SET seo_description = 'Sales funnel: ' || name
WHERE (seo_description IS NULL OR seo_description = '')
  AND name IS NOT NULL
  AND name != ''
  AND is_published = true;

-- ============================================
-- POPULATE EMPTY SEO FIELDS FOR FUNNEL STEPS
-- ============================================

-- Set funnel step seo_title to step title if empty
UPDATE funnel_steps
SET seo_title = title
WHERE (seo_title IS NULL OR seo_title = '')
  AND title IS NOT NULL
  AND title != ''
  AND is_published = true;

-- Set funnel step seo_description if empty
UPDATE funnel_steps
SET seo_description = title
WHERE (seo_description IS NULL OR seo_description = '')
  AND title IS NOT NULL
  AND title != ''
  AND is_published = true;
