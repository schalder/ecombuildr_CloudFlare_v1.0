import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userAgent = req.headers['user-agent'] || '';
  const url = req.url || '';
  
  // Check if this is a social media crawler
  const isSocialCrawler = /facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot/i.test(userAgent);
  
  if (!isSocialCrawler) {
    // Not a social crawler, serve the SPA
    return res.redirect(302, '/');
  }
  
  // Extract path from URL
  const path = url.split('?')[0];
  
  // Generate basic SEO HTML for social crawlers
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EcomBuildr - Build Your E-commerce Empire in Minutes</title>
  <meta name="description" content="Create professional e-commerce stores with our no-code platform. Build websites, funnels, and conversion systems that turn visitors into customers." />
  <meta name="robots" content="index, follow" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://get.ecombuildr.com${path}" />
  <meta property="og:title" content="EcomBuildr - Build Your E-commerce Empire in Minutes" />
  <meta property="og:description" content="Create professional e-commerce stores with our no-code platform. Build websites, funnels, and conversion systems that turn visitors into customers." />
  <meta property="og:image" content="https://res.cloudinary.com/funnelsninja/image/upload/v1755206321/ecombuildr-og-image_default.jpg" />
  <meta property="og:site_name" content="EcomBuildr" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://get.ecombuildr.com${path}" />
  <meta name="twitter:title" content="EcomBuildr - Build Your E-commerce Empire in Minutes" />
  <meta name="twitter:description" content="Create professional e-commerce stores with our no-code platform. Build websites, funnels, and conversion systems that turn visitors into customers." />
  <meta name="twitter:image" content="https://res.cloudinary.com/funnelsninja/image/upload/v1755206321/ecombuildr-og-image_default.jpg" />
  
  <!-- Redirect to main app after meta tags are read -->
  <script>
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  </script>
</head>
<body>
  <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
    <h1>EcomBuildr</h1>
    <p>Building your e-commerce empire...</p>
    <p><a href="/">Continue to App</a></p>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
  res.status(200).send(html);
}
