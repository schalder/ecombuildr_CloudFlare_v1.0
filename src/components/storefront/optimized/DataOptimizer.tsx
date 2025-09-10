// Data query optimization utilities for storefront pages

export const optimizedWebsitePageQuery = {
  select: `
    id,
    title,
    slug,
    content,
    seo_title,
    seo_description,
    og_image,
    social_image_url,
    custom_scripts,
    seo_keywords,
    meta_author,
    canonical_url,
    custom_meta_tags,
    language_code,
    meta_robots
  `
};

export const optimizedFunnelStepQuery = {
  select: `
    id,
    title,
    slug,
    content,
    seo_title,
    seo_description,
    og_image,
    social_image_url,
    custom_scripts,
    seo_keywords,
    meta_author,
    canonical_url,
    custom_meta_tags,
    language_code,
    meta_robots,
    is_published,
    step_order
  `
};

export const optimizedWebsiteQuery = {
  select: `
    id,
    name,
    slug,
    domain,
    settings,
    is_published,
    is_active
  `
};

export const optimizedFunnelQuery = {
  select: `
    id,
    name,
    slug,
    settings,
    is_published,
    is_active
  `
};