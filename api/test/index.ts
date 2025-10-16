export default async function handler(request: Request): Promise<Response> {
  const userAgent = request.headers.get('user-agent') || '';
  
  return new Response(JSON.stringify({
    message: 'Test API working',
    userAgent: userAgent.substring(0, 50),
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Test': 'api-working'
    },
  });
}
