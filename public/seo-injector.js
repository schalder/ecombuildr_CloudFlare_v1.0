// Client-side SEO injection for social crawlers
// This script runs immediately and updates meta tags before social crawlers can process them

(function() {
  'use strict';
  
  // Social media crawler detection
  const SOCIAL_CRAWLERS = [
    'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'WhatsApp', 'Slackbot',
    'DiscordBot', 'TelegramBot', 'SkypeUriPreview', 'facebookcatalog', 
    'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider', 'YandexBot',
    'facebookcatalog', 'Pinterestbot', 'Applebot', 'ia_archiver'
  ];

  const isSocialCrawler = (userAgent) => {
    return SOCIAL_CRAWLERS.some(crawler => 
      userAgent.toLowerCase().includes(crawler.toLowerCase())
    );
  };

  // Check if this is a social crawler
  const userAgent = navigator.userAgent;
  const isBot = isSocialCrawler(userAgent);
  
  if (!isBot) {
    return; // Only process SEO for social crawlers
  }

  console.log('🤖 Social crawler detected, injecting SEO meta tags...');

  // Detect if this is a custom domain
  const domain = window.location.hostname;
  const pathname = window.location.pathname;
  
  const isCustomDomain = !domain.includes('ecombuildr.com') && 
                        !domain.includes('localhost') && 
                        !domain.includes('lovable.dev') &&
                        !domain.includes('lovable.app') &&
                        !domain.includes('lovableproject.com');

  if (!isCustomDomain) {
    return; // Only process custom domains
  }

  console.log(`🌐 Custom domain detected: ${domain}${pathname}`);

  // Function to update meta tags
  const updateMetaTag = (property, content) => {
    if (!content) return;
    
    // Update existing meta tag
    let meta = document.querySelector(`meta[property="${property}"]`) || 
               document.querySelector(`meta[name="${property}"]`);
    
    if (meta) {
      meta.setAttribute('content', content);
    } else {
      // Create new meta tag
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    }
  };

  const updateTitle = (title) => {
    if (!title) return;
    document.title = title;
  };

  // Function to fetch SEO data
  const fetchSEOData = async () => {
    try {
      const response = await fetch(`/api/seo-data?domain=${encodeURIComponent(domain)}&path=${encodeURIComponent(pathname)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch SEO data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching SEO data:', error);
      return null;
    }
  };

  // Function to inject SEO data
  const injectSEO = (seoData) => {
    if (!seoData) {
      console.log('No SEO data available, using fallback');
      return;
    }

    console.log(`✅ Injecting SEO data: ${seoData.title} (${seoData.source})`);

    // Update title
    updateTitle(seoData.title);

    // Update meta tags
    updateMetaTag('description', seoData.description);
    updateMetaTag('keywords', seoData.keywords ? seoData.keywords.join(', ') : '');
    updateMetaTag('robots', seoData.robots);
    updateMetaTag('canonical', seoData.canonical);

    // Update Open Graph tags
    updateMetaTag('og:title', seoData.title);
    updateMetaTag('og:description', seoData.description);
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:url', seoData.canonical);
    updateMetaTag('og:site_name', seoData.site_name);
    updateMetaTag('og:locale', 'en_US');
    updateMetaTag('og:image', seoData.og_image);

    // Update Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', seoData.title);
    updateMetaTag('twitter:description', seoData.description);
    updateMetaTag('twitter:image', seoData.og_image);

    // Add debug headers as meta tags
    updateMetaTag('X-SEO-Source', seoData.source);
    updateMetaTag('X-SEO-Website', seoData.site_name);
    updateMetaTag('X-SEO-Page', seoData.title);
    updateMetaTag('X-SEO-Domain', domain);
    updateMetaTag('X-SEO-Path', pathname);

    if (seoData.debug) {
      if (seoData.debug.websiteId) updateMetaTag('X-SEO-Website-Id', seoData.debug.websiteId);
      if (seoData.debug.pageId) updateMetaTag('X-SEO-Page-Id', seoData.debug.pageId);
      if (seoData.debug.slug) updateMetaTag('X-SEO-Slug', seoData.debug.slug);
      if (seoData.debug.titleSource) updateMetaTag('X-SEO-Title-Source', seoData.debug.titleSource);
      if (seoData.debug.descSource) updateMetaTag('X-SEO-Desc-Source', seoData.debug.descSource);
      if (seoData.debug.imageSource) updateMetaTag('X-SEO-Image-Source', seoData.debug.imageSource);
    }

    console.log('✅ SEO meta tags injected successfully');
  };

  // Execute SEO injection
  fetchSEOData().then(injectSEO).catch(error => {
    console.error('SEO injection failed:', error);
  });

})();
