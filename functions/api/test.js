// Test function for specific route
export default {
  async fetch(request) {
    return new Response('Test function is working!', {
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
