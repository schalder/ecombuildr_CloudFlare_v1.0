// Test endpoint to verify Edge Function is working
export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  
  console.log('🧪 Test endpoint called');
  console.log('User Agent:', userAgent);
  console.log('URL:', url.toString());
  
  return new Response(JSON.stringify({
    message: 'Edge Function is working!',
    userAgent: userAgent,
    url: url.toString(),
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}
