// Test script for validating SSR SEO implementation
const https = require('https');
const http = require('http');

const TEST_CASES = [
  {
    name: 'Homepage - Bot',
    url: 'http://localhost:3000/',
    userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    expectedType: 'bot'
  },
  {
    name: 'Homepage - User',
    url: 'http://localhost:3000/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    expectedType: 'user'
  },
  {
    name: 'Page - Facebook',
    url: 'http://localhost:3000/test-page',
    userAgent: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    expectedType: 'bot'
  },
  {
    name: 'Page - Twitter',
    url: 'http://localhost:3000/test-page',
    userAgent: 'Twitterbot/1.0',
    expectedType: 'bot'
  },
  {
    name: 'Product - LinkedIn',
    url: 'http://localhost:3000/product/test-product',
    userAgent: 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Jakarta Commons-HttpClient/3.1 +http://www.linkedin.com)',
    expectedType: 'bot'
  },
  {
    name: 'Funnel Step - WhatsApp',
    url: 'http://localhost:3000/funnel/test-funnel/step-1',
    userAgent: 'WhatsApp/2.0',
    expectedType: 'bot'
  }
];

function fetchUrl(url, userAgent) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ 
        status: res.statusCode, 
        headers: res.headers,
        body: data 
      }));
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

function extractMetaTags(html) {
  const title = html.match(/<title>(.*?)<\/title>/)?.[1] || 'NOT FOUND';
  const description = html.match(/<meta name="description" content="(.*?)">/)?.[1] || 'NOT FOUND';
  const ogTitle = html.match(/<meta property="og:title" content="(.*?)">/)?.[1] || 'NOT FOUND';
  const ogImage = html.match(/<meta property="og:image" content="(.*?)">/)?.[1] || 'NOT FOUND';
  const ogUrl = html.match(/<meta property="og:url" content="(.*?)">/)?.[1] || 'NOT FOUND';
  const canonical = html.match(/<link rel="canonical" href="(.*?)">/)?.[1] || 'NOT FOUND';
  
  return { title, description, ogTitle, ogImage, ogUrl, canonical };
}

function checkPlaceholders(html) {
  const placeholders = [
    '__PAGE_TITLE__',
    '__PAGE_DESCRIPTION__',
    '__PAGE_IMAGE__',
    '__PAGE_URL__',
    '__SITE_NAME__'
  ];
  
  const found = placeholders.filter(p => html.includes(p));
  return found;
}

async function runTest(testCase) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Test: ${testCase.name}`);
  console.log(`URL: ${testCase.url}`);
  console.log(`User-Agent: ${testCase.userAgent.substring(0, 60)}...`);
  console.log('-'.repeat(80));
  
  try {
    const response = await fetchUrl(testCase.url, testCase.userAgent);
    
    // Check status code
    const statusOk = response.status === 200;
    console.log(`Status: ${response.status} ${statusOk ? '✅' : '❌'}`);
    
    // Check content type
    const contentType = response.headers['content-type'];
    const isHtml = contentType?.includes('text/html');
    console.log(`Content-Type: ${contentType} ${isHtml ? '✅' : '❌'}`);
    
    // Check for placeholders
    const placeholders = checkPlaceholders(response.body);
    if (testCase.expectedType === 'bot') {
      if (placeholders.length > 0) {
        console.log(`Placeholders found: ${placeholders.join(', ')} ❌ SHOULD BE REPLACED`);
      } else {
        console.log(`Placeholders replaced: ✅`);
      }
    } else {
      console.log(`Placeholders check: (not critical for users)`);
    }
    
    // Extract and display meta tags
    const meta = extractMetaTags(response.body);
    console.log('\nMeta Tags:');
    console.log(`  Title: ${meta.title}`);
    console.log(`  Description: ${meta.description.substring(0, 80)}...`);
    console.log(`  OG Title: ${meta.ogTitle}`);
    console.log(`  OG Image: ${meta.ogImage}`);
    console.log(`  OG URL: ${meta.ogUrl}`);
    console.log(`  Canonical: ${meta.canonical}`);
    
    // Check for React root
    const hasReactRoot = response.body.includes('<div id="root">');
    console.log(`\nReact Root: ${hasReactRoot ? '✅' : '❌'}`);
    
    // Check custom headers
    const traceId = response.headers['x-trace-id'];
    const userType = response.headers['x-user-type'];
    const seoSource = response.headers['x-seo-source'];
    
    if (traceId) console.log(`Trace ID: ${traceId}`);
    if (userType) console.log(`User Type: ${userType} ${userType === testCase.expectedType ? '✅' : '❌'}`);
    if (seoSource) console.log(`SEO Source: ${seoSource}`);
    
    // Overall result
    const passed = statusOk && isHtml && hasReactRoot && 
                   (testCase.expectedType !== 'bot' || placeholders.length === 0);
    
    console.log(`\nResult: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    return { testCase: testCase.name, passed, response };
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return { testCase: testCase.name, passed: false, error };
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('SSR SEO Testing Suite - Medium Article Implementation');
  console.log('='.repeat(80));
  
  const results = [];
  
  for (const testCase of TEST_CASES) {
    const result = await runTest(testCase);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('Test Summary');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(r => {
    console.log(`${r.passed ? '✅' : '❌'} ${r.testCase}`);
  });
  
  console.log('\n' + '-'.repeat(80));
  console.log(`Total: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! SSR SEO implementation is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
