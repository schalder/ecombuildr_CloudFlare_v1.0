import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const domain = request.headers.get('host') || '';
  
  console.log(`🧪 VERCEL MIDDLEWARE: ${domain}${url.pathname}`);
  
  // If this is shop.ghlmax.com, return a test response
  if (domain === 'shop.ghlmax.com') {
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>🎉 VERCEL MIDDLEWARE IS WORKING!</title>
        <meta name="description" content="This proves Vercel middleware is working" />
      </head>
      <body>
        <h1>🎉 VERCEL MIDDLEWARE IS WORKING!</h1>
        <p>Domain: ${domain}</p>
        <p>Path: ${url.pathname}</p>
        <p>If you see this, Vercel middleware is working!</p>
      </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
        'X-Test': 'vercel-middleware-working'
      }
    });
  }
  
  // For all other requests, continue normally
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
