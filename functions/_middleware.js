// Cloudflare Pages Functions Middleware - correct format from documentation
export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    const userAgent = context.request.headers.get('user-agent') || '';
    
    console.log(`🌐 Middleware: ${url.pathname} | UA: ${userAgent.substring(0, 80)}`);
    
    // Test endpoint
    if (url.pathname === '/test-middleware') {
      return new Response(JSON.stringify({
        message: 'Cloudflare Pages Function middleware is working!',
        pathname: url.pathname,
        userAgent: userAgent.substring(0, 100),
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
    
    // For all other requests, pass through to Pages
    return await context.next();
    
  } catch (err) {
    return new Response(`${err.message}\n${err.stack}`, { status: 500 });
  }
}