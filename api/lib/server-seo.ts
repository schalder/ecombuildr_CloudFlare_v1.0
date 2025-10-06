// Server-side SEO meta tag generation for Edge Function
// Generates complete HTML meta tags for each page

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url: string;
  siteName: string;
  type?: string;
  locale?: string;
}

export interface PageSEOData {
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  social_image_url?: string;
  og_image?: string;
  preview_image_url?: string;
  title?: string;
}

export interface WebsiteSEOData {
  name: string;
  settings?: {
    seo?: {
      title?: string;
      description?: string;
      keywords?: string[];
    };
    branding?: {
      favicon?: string;
      favicon_url?: string;
    };
    favicon?: string;
    favicon_url?: string;
  };
}

// Generate SEO data from page and website data
export function generateSEOData(
  page: PageSEOData,
  website: WebsiteSEOData,
  url: string
): SEOData {
  // Priority: page SEO > website SEO > defaults
  const title = page.seo_title || page.title || website.name || 'Page';
  const description = page.seo_description || website.settings?.seo?.description || `Welcome to ${website.name}`;
  const keywords = page.seo_keywords || website.settings?.seo?.keywords || [];
  
  // Image priority: social_image_url > og_image > preview_image_url > favicon
  const image = page.social_image_url || 
               page.og_image || 
               page.preview_image_url || 
               website.settings?.branding?.favicon || 
               website.settings?.branding?.favicon_url ||
               website.settings?.favicon ||
               website.settings?.favicon_url;

  return {
    title,
    description,
    keywords,
    image,
    url,
    siteName: website.name,
    type: 'website',
    locale: 'en_US'
  };
}

// Generate complete HTML meta tags
export function generateSEOTags(seoData: SEOData): string {
  const {
    title,
    description,
    keywords,
    image,
    url,
    siteName,
    type = 'website',
    locale = 'en_US'
  } = seoData;

  const keywordsMeta = keywords && keywords.length > 0 
    ? `<meta name="keywords" content="${keywords.join(', ')}" />` 
    : '';

  const imageMeta = image 
    ? `<meta property="og:image" content="${image}" />
       <meta name="twitter:image" content="${image}" />`
    : '';

  return `
    <!-- Primary Meta Tags -->
    <title>${escapeHtml(title)}</title>
    <meta name="title" content="${escapeHtml(title)}" />
    <meta name="description" content="${escapeHtml(description)}" />
    ${keywordsMeta}
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta property="og:locale" content="${locale}" />
    ${imageMeta}
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${escapeHtml(url)}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    
    <!-- Additional Meta Tags -->
    <meta name="robots" content="index, follow" />
    <meta name="author" content="${escapeHtml(siteName)}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta charset="UTF-8" />
  `;
}

// Generate favicon link tags
export function generateFaviconTags(website: WebsiteSEOData): string {
  const favicon = website.settings?.branding?.favicon || 
                 website.settings?.branding?.favicon_url ||
                 website.settings?.favicon ||
                 website.settings?.favicon_url;

  if (!favicon) {
    return '<link rel="icon" type="image/svg+xml" href="/favicon.ico" />';
  }

  return `
    <link rel="icon" type="image/png" href="${escapeHtml(favicon)}" />
    <link rel="shortcut icon" href="${escapeHtml(favicon)}" />
    <link rel="apple-touch-icon" href="${escapeHtml(favicon)}" />
  `;
}

// Generate canonical URL
export function generateCanonicalURL(url: string): string {
  return `<link rel="canonical" href="${escapeHtml(url)}" />`;
}

// Generate complete HTML head section
export function generateHTMLHead(
  page: PageSEOData,
  website: WebsiteSEOData,
  url: string,
  additionalCSS?: string,
  additionalJS?: string
): string {
  const seoData = generateSEOData(page, website, url);
  const seoTags = generateSEOTags(seoData);
  const faviconTags = generateFaviconTags(website);
  const canonicalTag = generateCanonicalURL(url);

  return `
    <head>
      ${seoTags}
      ${faviconTags}
      ${canonicalTag}
      
      <!-- Additional CSS -->
      ${additionalCSS || ''}
      
      <!-- Additional JavaScript -->
      ${additionalJS || ''}
    </head>
  `;
}

// Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Generate structured data (JSON-LD)
export function generateStructuredData(
  page: PageSEOData,
  website: WebsiteSEOData,
  url: string
): string {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": page.seo_title || page.title || website.name,
    "description": page.seo_description || `Welcome to ${website.name}`,
    "url": url,
    "isPartOf": {
      "@type": "WebSite",
      "name": website.name,
      "url": url.split('/').slice(0, 3).join('/')
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": url.split('/').slice(0, 3).join('/')
        }
      ]
    }
  };

  return `
    <script type="application/ld+json">
      ${JSON.stringify(structuredData, null, 2)}
    </script>
  `;
}
