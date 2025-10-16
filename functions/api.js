// Cloudflare Pages Function for API routes - correct format from documentation
export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    
    // Test endpoint
    if (url.pathname === '/api/test') {
      return new Response(JSON.stringify({
        message: 'Cloudflare Pages Function is working!',
        url: url.toString(),
        method: context.request.method,
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // For all other requests, pass through
    return await context.next();
    
  } catch (error) {
    return new Response('Error: ' + error.message, { status: 500 });
  }
}