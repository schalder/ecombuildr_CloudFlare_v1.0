const express = require('express');
const app = express();
const PORT = 3001;

app.use((req, res) => {
  const userAgent = req.get('User-Agent') || '';
  const hostname = req.get('Host') || req.hostname;
  
  console.log(`🌐 Request: ${hostname}${req.path}`);
  console.log(`🤖 User Agent: ${userAgent}`);
  console.log(`🤖 Is Facebook: ${userAgent.includes('facebookexternalhit')}`);
  
  if (userAgent.includes('facebookexternalhit')) {
    console.log('✅ Facebook crawler detected!');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>DYNAMIC SEO TITLE - ${hostname}</title>
        <meta name="description" content="DYNAMIC SEO DESCRIPTION for ${hostname}" />
        <meta property="og:title" content="DYNAMIC OG TITLE - ${hostname}" />
        <meta property="og:description" content="DYNAMIC OG DESCRIPTION for ${hostname}" />
      </head>
      <body>
        <h1>Dynamic SEO Content for ${hostname}</h1>
        <p>This is served to Facebook crawler!</p>
      </body>
      </html>
    `);
  } else {
    console.log('👤 Regular user');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Regular SPA</title>
      </head>
      <body>
        <div id="root">Regular SPA Content</div>
      </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
});
