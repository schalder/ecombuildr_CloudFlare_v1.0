// Health check endpoint to verify edge functions are working
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return new Response(
    JSON.stringify({
      ok: true,
      timestamp: Date.now(),
      edge: 'vercel',
      path: url.pathname,
      userAgent: userAgent.substring(0, 100),
      headers: {
        host: request.headers.get('host'),
        'x-forwarded-for': request.headers.get('x-forwarded-for'),
      }
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Edge-Handler': 'ping',
        'Cache-Control': 'no-store',
      },
    }
  );
}
