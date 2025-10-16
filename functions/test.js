// Cloudflare Pages Function with proper types - correct format from documentation
export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    
    // Test endpoint
    if (url.pathname === '/test') {
      return new Response(JSON.stringify({
        message: 'Cloudflare Pages Function is working!',
        url: url.toString(),
        method: context.request.method,
        timestamp: new Date().toISOString(),
        env: {
          hasSupabaseUrl: !!context.env.SUPABASE_URL,
          hasSupabaseKey: !!context.env.SUPABASE_ANON_KEY
        }
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