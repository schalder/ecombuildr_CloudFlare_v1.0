#!/usr/bin/env node

/**
 * SEO Middleware Debug Test Script
 * 
 * This script helps debug why the SEO middleware might not be working.
 * It simulates the same logic that runs in Cloudflare Pages Functions.
 */

// Simulate the URL parsing logic
function parseContentFromUrl(hostname, pathname) {
  console.log(`🔍 Parsing URL: ${hostname}${pathname}`);
  
  // System domain patterns - direct content resolution
  // Handle both /site/website-slug (homepage) and /site/website-slug/page-slug
  const siteMatch = pathname.match(/^\/site\/([^\/]+)(?:\/(.+))?$/);
  if (siteMatch) {
    const result = {
      type: 'website_page',
      websiteSlug: siteMatch[1],
      pageSlug: siteMatch[2] || 'homepage' // Default to 'homepage' if no page slug
    };
    console.log(`✅ Site match found:`, result);
    return result;
  }
  
  const funnelMatch = pathname.match(/^\/funnel\/([^\/]+)\/(.+)$/);
  if (funnelMatch) {
    const result = {
      type: 'funnel_step',
      funnelId: funnelMatch[1],
      stepSlug: funnelMatch[2]
    };
    console.log(`✅ Funnel match found:`, result);
    return result;
  }
  
  // Custom domain patterns - need to resolve via custom_domains table
  const isSystemDomain = hostname.includes('ecombuildr.com') || hostname.includes('get.ecombuildr.com') || hostname.includes('ecombuildr.pages.dev');
  if (!isSystemDomain) {
    const pathSegments = pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    if (lastSegment) {
      const result = {
        type: 'custom_domain_page', // Will also check for funnel steps
        pageSlug: lastSegment,
        stepSlug: lastSegment,
        isCustomDomain: true
      };
      console.log(`✅ Custom domain match found:`, result);
      return result;
    }
  }
  
  console.log(`❌ No match found`);
  return { type: 'unknown' };
}

// Simulate social crawler detection
function isSocialCrawler(userAgent) {
  const socialBots = [
    'facebookexternalhit',
    'facebookcatalog',
    'twitterbot',
    'linkedinbot',
    'whatsapp',
    'telegrambot',
    'skypeuripreview',
    'slackbot',
    'discordbot',
    'googlebot',
    'bingbot',
    'yandexbot',
    'baiduspider',
    'duckduckbot',
    'applebot',
    'crawler',
    'spider',
    'bot'
  ];
  
  const ua = userAgent.toLowerCase();
  const isBot = socialBots.some(bot => ua.includes(bot));
  console.log(`🤖 User Agent: ${userAgent}`);
  console.log(`🤖 Is Social Bot: ${isBot}`);
  return isBot;
}

// Test cases
const testCases = [
  {
    name: 'Facebook Debugger Test',
    hostname: 'ecombuildr.com',
    pathname: '/site/bd-ecommerce',
    userAgent: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
  },
  {
    name: 'Twitter Bot Test',
    hostname: 'ecombuildr.com',
    pathname: '/site/bd-ecommerce',
    userAgent: 'Twitterbot/1.0'
  },
  {
    name: 'Regular Browser Test',
    hostname: 'ecombuildr.com',
    pathname: '/site/bd-ecommerce',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  },
  {
    name: 'Specific Page Test',
    hostname: 'ecombuildr.com',
    pathname: '/site/bd-ecommerce/about',
    userAgent: 'facebookexternalhit/1.1'
  },
  {
    name: 'Funnel Test',
    hostname: 'ecombuildr.com',
    pathname: '/funnel/0672f6c3-ced8-411c-ae2f-2b7fb5e60963/sales-page-r6ygzx',
    userAgent: 'facebookexternalhit/1.1'
  }
];

console.log('🧪 SEO Middleware Debug Test\n');

testCases.forEach((testCase, index) => {
  console.log(`\n--- Test ${index + 1}: ${testCase.name} ---`);
  
  const contentInfo = parseContentFromUrl(testCase.hostname, testCase.pathname);
  const isSocialBot = isSocialCrawler(testCase.userAgent);
  
  const shouldHandleSEO = isSocialBot && (
    contentInfo.type === 'website_page' ||
    contentInfo.type === 'funnel_step' ||
    contentInfo.type === 'custom_domain_page'
  );
  
  console.log(`📊 Result:`);
  console.log(`   Content Type: ${contentInfo.type}`);
  console.log(`   Social Bot: ${isSocialBot}`);
  console.log(`   Handle SEO: ${shouldHandleSEO}`);
  
  if (shouldHandleSEO) {
    console.log(`✅ SEO middleware WOULD handle this request`);
  } else {
    console.log(`❌ SEO middleware would NOT handle this request`);
    if (!isSocialBot) {
      console.log(`   Reason: Not a social bot`);
    } else if (contentInfo.type === 'unknown') {
      console.log(`   Reason: Unknown content type`);
    }
  }
});

console.log('\n🔧 Debugging Tips:');
console.log('1. Check Cloudflare Pages Function logs for detailed output');
console.log('2. Verify Supabase environment variables are set correctly');
console.log('3. Test with Facebook Debugger: https://developers.facebook.com/tools/debug/');
console.log('4. Check if the website "bd-ecommerce" exists in your Supabase database');
console.log('5. Verify the website has proper SEO settings in the settings JSON field');
