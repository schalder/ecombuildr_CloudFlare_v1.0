// Cloudflare Pages Functions middleware
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    
    console.log(`🌐 Middleware: ${url.pathname} | UA: ${userAgent.substring(0, 80)}`);
    
    // Test endpoint
    if (url.pathname === '/test-middleware') {
      return new Response(JSON.stringify({
        message: 'Cloudflare Pages Function middleware is working!',
        pathname: url.pathname,
        userAgent: userAgent.substring(0, 100),
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
    
    // For all other requests, pass through to Pages
    return new Response(null, { status: 200 });
  }
};
