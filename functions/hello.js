// Cloudflare Pages Function with proper error handling
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // Test endpoint
      if (url.pathname === '/hello') {
        return new Response('Hello from Cloudflare Pages Function!', {
          headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // For all other requests, pass through
      return new Response(null, { status: 200 });
    } catch (error) {
      return new Response('Error: ' + error.message, { status: 500 });
    }
  }
};