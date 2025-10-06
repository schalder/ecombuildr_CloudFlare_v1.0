// Simple test Edge Function
export default async function handler(request: Request): Promise<Response> {
  console.log('🚀 SIMPLE EDGE FUNCTION TRIGGERED!');
  
  return new Response('Hello from Vercel Edge Function!', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'X-Test': 'Edge Function Working'
    },
  });
}
