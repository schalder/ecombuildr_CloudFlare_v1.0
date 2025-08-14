// Centralized SEO utility for pages, websites, and funnels
// Provides consistent meta, OG, Twitter, canonical, and robots handling

export type SEOConfig = {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  robots?: string; // e.g., "index, follow" or "noindex, nofollow"
  siteName?: string;
  ogType?: string; // e.g., 'website', 'article', 'product'
  locale?: string; // e.g., 'en_US'
  favicon?: string; // URL to favicon (png/ico)
  structuredData?: Record<string, any> | Record<string, any>[]; // JSON-LD
  headerTrackingCode?: string; // Custom header tracking code
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

export function setSEO(input: SEOConfig) {
  const cfg: SEOConfig = {
    ogType: 'website',
    locale: 'en_US',
    ...input,
  };

  // Title
  if (cfg.title) {
    document.title = cfg.title;
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: cfg.title });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: cfg.title });
  }

  // Description
  if (cfg.description) {
    upsertMeta('meta[name="description"]', { name: 'description', content: cfg.description });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: cfg.description });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: cfg.description });
  }

  // Image
  if (cfg.image) {
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: cfg.image });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: cfg.image });
  }

  // Site name & type
  if (cfg.siteName) {
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: cfg.siteName });
  }
  if (cfg.ogType) {
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: cfg.ogType });
  }
  if (cfg.locale) {
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: cfg.locale });
  }

  // Twitter card
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });

  // Canonical
  if (cfg.canonical) {
    upsertLink('canonical', cfg.canonical);
  }

  // Robots
  if (cfg.robots) {
    upsertMeta('meta[name="robots"]', { name: 'robots', content: cfg.robots });
  }

  // Favicon
  if (cfg.favicon) {
    // Standard icon
    upsertLink('icon', cfg.favicon);
    // Legacy/Windows support
    upsertLink('shortcut icon', cfg.favicon);
    // iOS home screen (PNG recommended)
    upsertLink('apple-touch-icon', cfg.favicon);
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

  // Header Tracking Code
  removeIfExists('[data-tracking="header"]');
  if (cfg.headerTrackingCode) {
    const div = document.createElement('div');
    div.setAttribute('data-tracking', 'header');
    div.innerHTML = cfg.headerTrackingCode;
    document.head.appendChild(div);
  }
}

// Utility function to inject footer tracking code
export function setFooterTrackingCode(trackingCode: string | undefined) {
  // Remove existing footer tracking code
  const existing = document.querySelector('[data-tracking="footer"]');
  if (existing) {
    existing.remove();
  }

  if (trackingCode && trackingCode.trim()) {
    const div = document.createElement('div');
    div.setAttribute('data-tracking', 'footer');
    div.innerHTML = trackingCode;
    document.body.appendChild(div);
  }
}
