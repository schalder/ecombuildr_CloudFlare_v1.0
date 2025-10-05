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

  const SUPABASE_URL = "https://fhqwacmokbtbspkxjixf.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM";

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

  // Function to fetch data from Supabase
  const fetchFromSupabase = async (endpoint) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Supabase fetch error:', error);
      return null;
    }
  };

  // Function to resolve SEO data
  const resolveSEOData = async () => {
    try {
      // Get domain connection info
      const connections = await fetchFromSupabase(`domain_connections?domain=eq.${domain}&select=content_type,content_id,store_id`);
      if (!connections || connections.length === 0) {
        console.log('No domain connection found for:', domain);
        return null;
      }

      const connection = connections[0];
      console.log('Found domain connection:', connection);

      // Route to appropriate resolver based on content type
      switch (connection.content_type) {
        case 'website':
          return await resolveWebsiteSEO(connection.content_id, pathname);
        case 'funnel':
          return await resolveFunnelSEO(connection.content_id, pathname);
        case 'course_area':
          return await resolveCourseAreaSEO(domain);
        default:
          console.log('Unknown content type:', connection.content_type);
          return null;
      }
    } catch (error) {
      console.error('Error resolving SEO data:', error);
      return null;
    }
  };

  // Helper function to resolve website SEO data
  const resolveWebsiteSEO = async (websiteId, pathname) => {
    try {
      const websites = await fetchFromSupabase(`websites?id=eq.${websiteId}&select=name,description`);
      if (!websites || websites.length === 0) return null;

      const website = websites[0];

      if (pathname === '/' || pathname === '') {
        return {
          title: website.name || 'Website',
          description: website.description || `Visit ${website.name}`,
          og_image: undefined,
          keywords: ['website', 'online store'],
          canonical: `https://${domain}`,
          robots: 'index, follow',
          site_name: website.name || 'Website',
          source: 'website_root'
        };
      }

      const pathSegments = pathname.split('/').filter(Boolean);
      const pageSlug = pathSegments[pathSegments.length - 1];

      const pages = await fetchFromSupabase(`website_pages?website_id=eq.${websiteId}&slug=eq.${pageSlug}&is_published=eq.true&select=id,title,seo_title,seo_description,og_image,slug,is_published`);
      if (!pages || pages.length === 0) return null;

      const page = pages[0];
      return {
        title: page.seo_title || page.title || `${website.name} - ${pageSlug}`,
        description: page.seo_description || `Visit ${page.title || pageSlug} on ${website.name}`,
        og_image: page.og_image || undefined,
        keywords: ['website', 'page', pageSlug],
        canonical: `https://${domain}${pathname}`,
        robots: 'index, follow',
        site_name: website.name || 'Website',
        source: 'website_page'
      };
    } catch (error) {
      console.error('Error resolving website SEO:', error);
      return null;
    }
  };

  // Helper function to resolve funnel SEO data
  const resolveFunnelSEO = async (funnelId, pathname) => {
    try {
      const funnels = await fetchFromSupabase(`funnels?id=eq.${funnelId}&select=name,description,seo_title,seo_description,og_image`);
      if (!funnels || funnels.length === 0) return null;

      const funnel = funnels[0];

      if (pathname === '/' || pathname === '') {
        return {
          title: funnel.seo_title || funnel.name || 'Sales Funnel',
          description: funnel.seo_description || funnel.description || `Visit ${funnel.name}`,
          og_image: funnel.og_image || undefined,
          keywords: ['sales funnel', 'marketing'],
          canonical: `https://${domain}`,
          robots: 'index, follow',
          site_name: funnel.name || 'Sales Funnel',
          source: 'funnel_root'
        };
      }

      const pathSegments = pathname.split('/').filter(Boolean);
      const stepSlug = pathSegments[pathSegments.length - 1];

      const steps = await fetchFromSupabase(`funnel_steps?funnel_id=eq.${funnelId}&slug=eq.${stepSlug}&is_published=eq.true&select=id,title,seo_title,seo_description,og_image,slug,is_published`);
      if (!steps || steps.length === 0) return null;

      const step = steps[0];
      return {
        title: step.seo_title || step.title || `${funnel.name} - ${stepSlug}`,
        description: step.seo_description || `Visit ${step.title || stepSlug} on ${funnel.name}`,
        og_image: step.og_image || funnel.og_image || undefined,
        keywords: ['sales funnel', 'step', stepSlug],
        canonical: `https://${domain}${pathname}`,
        robots: 'index, follow',
        site_name: funnel.name || 'Sales Funnel',
        source: 'funnel_step'
      };
    } catch (error) {
      console.error('Error resolving funnel SEO:', error);
      return null;
    }
  };

  // Helper function to resolve course area SEO data
  const resolveCourseAreaSEO = async (domain) => {
    return {
      title: 'Course Area - EcomBuildr',
      description: 'Access your courses and learning materials on EcomBuildr',
      og_image: undefined,
      keywords: ['courses', 'learning', 'education'],
      canonical: `https://${domain}`,
      robots: 'index, follow',
      site_name: 'EcomBuildr Course Area',
      source: 'course_area'
    };
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

    console.log('✅ SEO meta tags injected successfully');
  };

  // Execute SEO injection
  resolveSEOData().then(injectSEO).catch(error => {
    console.error('SEO injection failed:', error);
  });

})();