// Simple JavaScript function for Cloudflare Pages Functions
export default {
  async fetch(request) {
    return new Response('Hello from Cloudflare Pages Function!', {
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
