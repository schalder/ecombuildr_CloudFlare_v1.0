// Cloudflare Pages Function - correct format from documentation
export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    
    // Simple test response
    if (url.pathname === '/hello') {
      return new Response('Hello from Cloudflare Pages Function!', {
        headers: {
          'Content-Type': 'text/plain',
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