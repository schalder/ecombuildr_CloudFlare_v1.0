export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const domain = request.headers.get('x-forwarded-host') || url.hostname;
  const path = url.searchParams.get('path') || '/';
  
  const debugInfo = {
    url: url.toString(),
    domain,
    path,
    userAgent,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString()
  };
  
  return new Response(JSON.stringify(debugInfo, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}
