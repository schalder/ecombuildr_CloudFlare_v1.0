// Vercel Edge Function - Proxy to Supabase Edge Function
export const config = {
  runtime: 'edge',
};

const SUPABASE_URL = 'https://fhqwacmokbtbspkxjixf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM';

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const hostname = request.headers.get('host') || 'localhost';
  
  // Extract query params
  const path = url.searchParams.get('path') || '/';
  const force = url.searchParams.get('force') || '0';
  const health = url.searchParams.get('health') || '0';
  
  console.log(`[Vercel Proxy] ${hostname}${path} | UA: ${userAgent.substring(0, 60)}`);
  
  try {
    // Call Supabase Edge Function
    const supabaseUrl = `${SUPABASE_URL}/functions/v1/seo-render`;
    const params = new URLSearchParams({
      path,
      hostname,
      force,
      health
    });
    
    const response = await fetch(`${supabaseUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'user-agent': userAgent,
        'Content-Type': 'application/json'
      }
    });
    
    const contentType = response.headers.get('content-type') || '';
    
    // If it's HTML, return it directly
    if (contentType.includes('text/html')) {
      const html = await response.text();
      return new Response(html, {
        status: response.status,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': response.headers.get('cache-control') || 'public, max-age=300',
          'X-SEO-Handler': 'vercel-proxy',
          'X-SEO-Source': response.headers.get('x-seo-handler') || 'supabase'
        }
      });
    }
    
    // If it's JSON (health check or bot=false), return it
    if (contentType.includes('application/json')) {
      const json = await response.json();
      
      // If bot=false, this means it's a regular user, not a bot
      // Return empty response so Vercel falls through to serve SPA
      if (json.bot === false) {
        return new Response(null, {
          status: 204, // No content - fall through to next route
          headers: {
            'X-SEO-Handler': 'vercel-proxy',
            'X-Bot-Detected': 'false'
          }
        });
      }
      
      return new Response(JSON.stringify(json), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'X-SEO-Handler': 'vercel-proxy'
        }
      });
    }
    
    // Fallback - return response as-is
    return response;
    
  } catch (error) {
    console.error('[Vercel Proxy] Error:', error);
    
    // On error, return empty response to fall through to SPA
    return new Response(null, {
      status: 204,
      headers: {
        'X-SEO-Handler': 'vercel-proxy',
        'X-SEO-Error': error.message
      }
    });
  }
}
