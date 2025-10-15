import { NextRequest, NextResponse } from 'next/server';

// Social media crawler detection
const SOCIAL_CRAWLERS = [
  'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'WhatsApp', 'Slackbot',
  'DiscordBot', 'TelegramBot', 'SkypeUriPreview', 'facebookcatalog', 
  'facebookplatform', 'Facebot', 'FacebookBot', 'Googlebot', 'Bingbot',
  'bot', 'crawler', 'spider', 'baiduspider', 'yandex', 'duckduckbot',
  'slurp', 'ia_archiver', 'semrushbot', 'ahrefsbot', 'dotbot',
  'pinterestbot', 'applebot', 'yahoobot'
];

function isSocialCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SOCIAL_CRAWLERS.some(crawler => ua.includes(crawler.toLowerCase()));
}

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const url = request.nextUrl;
  
  // Skip API routes
  if (url.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Skip static assets
  if (url.pathname.startsWith('/assets/') || 
      url.pathname.startsWith('/_next/') ||
      url.pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // Check if this is a social crawler
  const isSocialBot = isSocialCrawler(userAgent);
  
  if (isSocialBot) {
    console.log(`🤖 Bot detected: ${userAgent.substring(0, 50)}`);
    
    // Redirect to SEO API
    const seoUrl = new URL('/api/[...catchall]', url.origin);
    seoUrl.searchParams.set('path', url.pathname);
    
    return NextResponse.rewrite(seoUrl);
  }
  
  // Regular users get the SPA
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
