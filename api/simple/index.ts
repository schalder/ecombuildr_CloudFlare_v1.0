export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  console.log('🚀 SIMPLE EDGE FUNCTION TRIGGERED!');
  
  const url = new URL(request.url);
  const domain = url.hostname;
  
  return new Response(`Hello from Vercel Edge Function! Domain: ${domain}`, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'X-Test': 'Edge Function Working',
      'X-Domain': domain
    },
  });
}
