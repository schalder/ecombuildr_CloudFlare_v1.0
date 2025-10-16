// Minimal test function for Cloudflare Pages Functions
export default {
  async fetch(request: Request): Promise<Response> {
    return new Response('Hello from Cloudflare Pages Function!', {
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
