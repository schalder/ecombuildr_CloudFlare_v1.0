// Simple middleware function for Cloudflare Pages Functions
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    
    console.log(`🌐 Request: ${url.pathname} | UA: ${userAgent.substring(0, 80)}`);
    
    // Simple test - return a basic response for now
    if (url.pathname === '/test-middleware') {
      return new Response(JSON.stringify({
        message: 'Middleware is working!',
        pathname: url.pathname,
        userAgent: userAgent.substring(0, 100),
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // For all other requests, pass through
    return new Response(null, { status: 200 });
  }
};
