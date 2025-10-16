// Simple test function to verify Cloudflare Pages Functions are working
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    
    // Simple test response
    if (url.pathname === '/test-function') {
      return new Response(JSON.stringify({
        message: 'Cloudflare Pages Function is working!',
        timestamp: new Date().toISOString(),
        pathname: url.pathname,
        userAgent: request.headers.get('user-agent')
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
