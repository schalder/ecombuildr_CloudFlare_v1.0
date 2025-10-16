// Centralized SEO utility for pages, websites, and funnels
// Provides consistent meta, OG, Twitter, canonical, and robots handling

import { logger } from './logger';

export type SEOConfig = {
  title?: string;
  description?: string;
  image?: string;
  socialImageUrl?: string;
  keywords?: string[];
  canonical?: string;
  robots?: string; // e.g., "index, follow" or "noindex, nofollow"
  author?: string;
  languageCode?: string;
  customMetaTags?: { name: string; content: string }[];
  siteName?: string;
  ogType?: string; // e.g., 'website', 'article', 'product'
  locale?: string; // e.g., 'en_US'
  favicon?: string; // URL to favicon (png/ico)
  structuredData?: Record<string, any> | Record<string, any>[]; // JSON-LD
};

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    document.head.appendChild(el);
  } else {
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
  }
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    el.setAttribute('href', href);
    document.head.appendChild(el);
  } else {
    el.setAttribute('href', href);
  }
}

function removeIfExists(selector: string) {
  const el = document.head.querySelector(selector);
  if (el) document.head.removeChild(el);
}

export function buildCanonical(currentPath?: string, canonicalDomain?: string) {
  if (canonicalDomain) {
    const path = currentPath || (typeof window !== 'undefined' ? window.location.pathname : '/');
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
    const host = canonicalDomain.replace(/^https?:\/\//, '');
    return `${protocol}//${host}${path}`;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${window.location.pathname}`;
  }
  return undefined;
}

// Add this helper at the top of the file
function updateMetaTag(selector: string, attribute: string, value: string) {
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute(attribute, value);
  } else {
    // Create the tag if it doesn't exist
    const meta = document.createElement('meta');
    if (attribute === 'property') {
      meta.setAttribute('property', selector.match(/\[property="(.+?)"\]/)?.[1] || '');
    } else {
      meta.setAttribute('name', selector.match(/\[name="(.+?)"\]/)?.[1] || '');
    }
    meta.setAttribute('content', value);
    document.head.appendChild(meta);
  }
}

export function setSEO(input: SEOConfig) {
  const callerInfo = new Error().stack?.split('\n')[2]?.trim() || 'unknown caller';
  logger.debug('🔍 setSEO called with:', { 
    favicon: input.favicon, 
    title: input.title,
    caller: callerInfo
  });
  
  const cfg: SEOConfig = {
    ogType: 'website',
    locale: 'en_US',
    ...input,
  };

  // Title
  if (cfg.title) {
    document.title = cfg.title;
    updateMetaTag('meta[property="og:title"]', 'content', cfg.title);
    updateMetaTag('meta[name="twitter:title"]', 'content', cfg.title);
  }

  // Description
  if (cfg.description) {
    updateMetaTag('meta[name="description"]', 'content', cfg.description);
    updateMetaTag('meta[property="og:description"]', 'content', cfg.description);
    updateMetaTag('meta[name="twitter:description"]', 'content', cfg.description);
  }

  // Image
  const imageUrl = cfg.socialImageUrl || cfg.image;
  if (imageUrl) {
    updateMetaTag('meta[property="og:image"]', 'content', imageUrl);
    updateMetaTag('meta[property="og:image:secure_url"]', 'content', imageUrl);
    updateMetaTag('meta[name="twitter:image"]', 'content', imageUrl);
  }

  // Keywords
  if (cfg.keywords && cfg.keywords.length > 0) {
    updateMetaTag('meta[name="keywords"]', 'content', cfg.keywords.join(', '));
  }

  // Author
  if (cfg.author) {
    updateMetaTag('meta[name="author"]', 'content', cfg.author);
  }

  // Language
  if (cfg.languageCode) {
    updateMetaTag('meta[name="language"]', 'content', cfg.languageCode);
    document.documentElement.lang = cfg.languageCode;
  }

  // Custom Meta Tags
  if (cfg.customMetaTags) {
    cfg.customMetaTags.forEach(tag => {
      updateMetaTag(`meta[name="${tag.name}"]`, 'content', tag.content);
    });
  }

  // Site name
  if (cfg.siteName) {
    updateMetaTag('meta[property="og:site_name"]', 'content', cfg.siteName);
  }

  // OG Type
  if (cfg.ogType) {
    updateMetaTag('meta[property="og:type"]', 'content', cfg.ogType);
  }

  // Locale
  if (cfg.locale) {
    updateMetaTag('meta[property="og:locale"]', 'content', cfg.locale);
  }

  // Twitter card
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });

  // Canonical
  if (cfg.canonical) {
    upsertLink('canonical', cfg.canonical);
  }

  // Robots
  if (cfg.robots) {
    updateMetaTag('meta[name="robots"]', 'content', cfg.robots);
  }

  // Favicon with race condition protection
  if (cfg.favicon) {
    logger.debug('🔥 Setting favicon to:', cfg.favicon);
    
    // Remove ALL existing favicon-related links to prevent conflicts
    const faviconSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]', 
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]',
      'link[type="image/x-icon"]',
      'link[type="image/png"]'
    ];
    
    faviconSelectors.forEach(selector => {
      document.head.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Force browser cache clear with timestamp + random
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const cacheBuster = `t=${timestamp}&r=${random}`;
    const faviconUrl = cfg.favicon + (cfg.favicon.includes('?') ? '&' : '?') + cacheBuster;

    // Create new favicon link with proper attributes
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png'; // Be specific about type
    link.href = faviconUrl;
    link.setAttribute('data-dynamic-favicon', 'true'); // Mark as dynamic
    link.setAttribute('data-original-url', cfg.favicon); // Store original URL
    document.head.appendChild(link);

    // Also add shortcut icon for legacy browsers
    const shortcutLink = document.createElement('link');
    shortcutLink.rel = 'shortcut icon';
    shortcutLink.type = 'image/png';
    shortcutLink.href = faviconUrl;
    shortcutLink.setAttribute('data-dynamic-favicon', 'true');
    document.head.appendChild(shortcutLink);
  }

  // JSON-LD Structured Data
  removeIfExists('script[type="application/ld+json"][data-managed="seo"]');
  if (cfg.structuredData) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-managed', 'seo');
    script.textContent = JSON.stringify(cfg.structuredData);
    document.head.appendChild(script);
  }
}
