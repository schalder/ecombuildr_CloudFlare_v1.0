export default async function handler(request: Request): Promise<Response> {
  return new Response('Hello from Edge Function!', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'X-Test': 'edge-function-working'
    },
  });
}