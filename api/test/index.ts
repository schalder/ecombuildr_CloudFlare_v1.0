export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const domain = url.hostname;
  
  console.log(`🧪 TEST EDGE FUNCTION: ${domain}${url.pathname}`);
  
  // If this is shop.ghlmax.com, return a test response
  if (domain === 'shop.ghlmax.com') {
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>🎉 EDGE FUNCTION IS WORKING!</title>
        <meta name="description" content="This proves Edge Functions are working" />
      </head>
      <body>
        <h1>🎉 EDGE FUNCTION IS WORKING!</h1>
        <p>Domain: ${domain}</p>
        <p>Path: ${url.pathname}</p>
        <p>If you see this, Edge Functions are working!</p>
      </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
        'X-Test': 'edge-function-working'
      }
    });
  }
  
  // For all other requests, return 404 to let Vercel handle routing
  return new Response('Not Found', { status: 404 });
}

export const config = {
  runtime: 'edge',
};
