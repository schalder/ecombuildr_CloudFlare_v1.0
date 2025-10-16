// Cloudflare Pages Function for API routes
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Test endpoint
    if (url.pathname === '/api/test') {
      return new Response(JSON.stringify({
        message: 'Cloudflare Pages Function is working!',
        url: url.toString(),
        method: request.method,
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
