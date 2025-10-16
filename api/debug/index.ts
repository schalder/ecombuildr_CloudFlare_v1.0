export default async function handler(request: Request): Promise<Response> {
  try {
    // Get headers safely
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    const debugInfo = {
      method: request.method,
      url: request.url,
      headers,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || 'No user agent',
      host: request.headers.get('host') || 'No host',
      'x-forwarded-host': request.headers.get('x-forwarded-host') || 'No x-forwarded-host',
      'x-forwarded-proto': request.headers.get('x-forwarded-proto') || 'No x-forwarded-proto',
      referer: request.headers.get('referer') || 'No referer'
    };
    
    return new Response(JSON.stringify(debugInfo, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
