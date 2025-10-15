const testUrls = [
  'http://localhost:3000/', // Test homepage
  'http://localhost:3000/test-page', // Test page
  'http://localhost:3000/funnel-step' // Test funnel step
];

const userAgents = [
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'Twitterbot/1.0'
];

async function testSEO(url, userAgent) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': userAgent }
    });
    const html = await response.text();
    console.log(`\n✅ ${url}`);
    console.log(`Status: ${response.status}`);
    console.log(`Title: ${html.match(/<title>(.*?)<\/title>/)?.[1] || 'No title'}`);
    console.log(`Description: ${html.match(/<meta name="description" content="(.*?)">/)?.[1] || 'No description'}`);
    console.log(`OG Image: ${html.match(/<meta property="og:image" content="(.*?)">/)?.[1] || 'No image'}`);
    console.log(`Canonical: ${html.match(/<link rel="canonical" href="(.*?)">/)?.[1] || 'No canonical'}`);
    console.log(`Robots: ${html.match(/<meta name="robots" content="(.*?)">/)?.[1] || 'No robots'}`);
  } catch (error) {
    console.log(`❌ ${url} - Error: ${error.message}`);
  }
}

(async () => {
  console.log('🧪 Testing SEO Implementation');
  console.log('=============================');
  
  for (const url of testUrls) {
    for (const userAgent of userAgents) {
      await testSEO(url, userAgent);
    }
  }
  
  console.log('\n✅ SEO Testing Complete');
})();
