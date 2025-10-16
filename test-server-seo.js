// Test script to verify SEO is working with Node.js server
const testUrls = [
  'http://localhost:3000/', // Homepage
  'http://localhost:3000/test-page', // Website page
  'http://localhost:3000/test-step' // Funnel step
];

const userAgents = [
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'Twitterbot/1.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' // Regular browser
];

async function testSEO(url, userAgent) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': userAgent }
    });
    
    const html = await response.text();
    const isBot = userAgent.toLowerCase().includes('bot') || userAgent.includes('facebook');
    
    console.log(`\n${isBot ? '🤖' : '👤'} ${url}`);
    console.log(`UA: ${userAgent.substring(0, 50)}...`);
    console.log(`Status: ${response.status}`);
    
    if (isBot) {
      const title = html.match(/<title>(.*?)<\/title>/)?.[1];
      const desc = html.match(/<meta name="description" content="(.*?)">/)?.[1];
      const ogImage = html.match(/<meta property="og:image" content="(.*?)">/)?.[1];
      const ogTitle = html.match(/<meta property="og:title" content="(.*?)">/)?.[1];
      
      console.log(`✓ Title: ${title || 'MISSING'}`);
      console.log(`✓ Description: ${desc || 'MISSING'}`);
      console.log(`✓ OG Title: ${ogTitle || 'MISSING'}`);
      console.log(`✓ OG Image: ${ogImage || 'MISSING'}`);
      
      // Check if it's dynamic content (not hardcoded defaults)
      const isDynamic = title && !title.includes('EcomBuildr - Build Your E-commerce Empire');
      console.log(`✓ Dynamic Content: ${isDynamic ? 'YES' : 'NO (hardcoded defaults)'}`);
    } else {
      console.log(`✓ Received SPA (${html.includes('<div id="root">') ? 'correct' : 'WRONG'})`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('=== SEO Test Suite with Node.js Server ===\n');
  console.log('Make sure to run: npm run serve');
  console.log('Then test with: node test-server-seo.js\n');
  
  for (const url of testUrls) {
    for (const userAgent of userAgents) {
      await testSEO(url, userAgent);
    }
  }
}

runTests();
