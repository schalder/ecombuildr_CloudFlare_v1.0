// Test script specifically for Facebook crawler SEO
const testUrls = [
  'https://store.powerkits.net/',
  'https://shop.powerkits.net/',
  'https://get.ecombuildr.com/'
];

const facebookUserAgents = [
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'facebookexternalhit/1.1',
  'facebookcatalog/1.0',
  'facebookplatform/1.0',
  'Facebot/1.0',
  'FacebookBot/1.0'
];

async function testFacebookSEO(url, userAgent) {
  try {
    console.log(`\n🤖 Testing: ${url}`);
    console.log(`📱 User Agent: ${userAgent}`);
    
    const response = await fetch(url, {
      headers: { 'User-Agent': userAgent }
    });
    
    const html = await response.text();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📏 Content Length: ${response.headers.get('content-length') || 'Not set'}`);
    console.log(`🔍 Accept-Ranges: ${response.headers.get('accept-ranges') || 'Not set'}`);
    console.log(`🏷️ X-SEO-Source: ${response.headers.get('x-seo-source') || 'Not set'}`);
    console.log(`🔗 X-SEO-Pattern: ${response.headers.get('x-seo-pattern') || 'Not set'}`);
    console.log(`🌐 X-SEO-Website: ${response.headers.get('x-seo-website') || 'Not set'}`);
    
    // Extract meta tags
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    const desc = html.match(/<meta name="description" content="(.*?)">/)?.[1];
    const ogImage = html.match(/<meta property="og:image" content="(.*?)">/)?.[1];
    const ogTitle = html.match(/<meta property="og:title" content="(.*?)">/)?.[1];
    
    console.log(`📝 Title: ${title || 'MISSING'}`);
    console.log(`📄 Description: ${desc || 'MISSING'}`);
    console.log(`🖼️ OG Image: ${ogImage || 'MISSING'}`);
    console.log(`🏷️ OG Title: ${ogTitle || 'MISSING'}`);
    
    // Check if it's getting hardcoded defaults
    if (title && title.includes('EcomBuildr - Build Your E-commerce Empire')) {
      console.log(`⚠️ WARNING: Getting hardcoded defaults instead of dynamic content!`);
    }
    
    if (response.status === 206) {
      console.log(`❌ ERROR: Response Code 206 - Partial Content!`);
    }
    
    // Check if HTML is complete
    if (!html.includes('</html>')) {
      console.log(`❌ ERROR: Incomplete HTML response!`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function runFacebookTests() {
  console.log('=== Facebook Crawler SEO Test Suite ===\n');
  
  for (const url of testUrls) {
    for (const userAgent of facebookUserAgents) {
      await testFacebookSEO(url, userAgent);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
    }
  }
  
  console.log('\n=== Test Complete ===');
  console.log('Check the results above:');
  console.log('- Status should be 200 (not 206)');
  console.log('- Should have proper SEO meta tags');
  console.log('- Should NOT have hardcoded "EcomBuildr" defaults');
  console.log('- HTML should be complete with </html> tag');
}

runFacebookTests();
