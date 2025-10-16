// Cloudflare Pages Function with proper types
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Test endpoint
    if (url.pathname === '/test') {
      return new Response(JSON.stringify({
        message: 'Cloudflare Pages Function is working!',
        url: url.toString(),
        method: request.method,
        timestamp: new Date().toISOString(),
        env: {
          hasSupabaseUrl: !!env.SUPABASE_URL,
          hasSupabaseKey: !!env.SUPABASE_ANON_KEY
        }
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
