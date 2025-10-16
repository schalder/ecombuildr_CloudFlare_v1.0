export default async function handler(req: any, res: any) {
  console.log('🚀 SEO API handler started');
  
  const userAgent = req.headers['user-agent'] || '';
  console.log('🤖 User Agent:', userAgent);
  
  // Simple bot detection
  const isBot = userAgent.toLowerCase().includes('facebookexternalhit');
  console.log('🤖 Is bot:', isBot);
  
  if (isBot) {
    console.log('🤖 Bot detected - serving SEO HTML');
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EcomBuildr - Build Your E-commerce Empire</title>
  <meta name="description" content="Create stunning e-commerce websites and sales funnels with EcomBuildr. No coding required. Start your online business today with our powerful drag-and-drop builder." />
  <meta name="robots" content="index, follow" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://get.ecombuildr.com/" />
  <meta property="og:title" content="EcomBuildr - Build Your E-commerce Empire" />
  <meta property="og:description" content="Create stunning e-commerce websites and sales funnels with EcomBuildr. No coding required. Start your online business today with our powerful drag-and-drop builder." />
  <meta property="og:image" content="https://get.ecombuildr.com/hero-ecommerce.jpg" />
  <meta property="og:site_name" content="EcomBuildr" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://get.ecombuildr.com/" />
  <meta name="twitter:title" content="EcomBuildr - Build Your E-commerce Empire" />
  <meta name="twitter:description" content="Create stunning e-commerce websites and sales funnels with EcomBuildr. No coding required. Start your online business today with our powerful drag-and-drop builder." />
  <meta name="twitter:image" content="https://get.ecombuildr.com/hero-ecommerce.jpg" />
  
  <link rel="canonical" href="https://get.ecombuildr.com/" />
</head>
<body>
  <div id="root">
    <header>
      <h1>EcomBuildr - Build Your E-commerce Empire</h1>
    </header>
    <main>
      <p>Create stunning e-commerce websites and sales funnels with EcomBuildr. No coding required. Start your online business today with our powerful drag-and-drop builder.</p>
      <p>Loading content...</p>
    </main>
  </div>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Length', html.length.toString());
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('X-SEO-Source', 'simple_bot');
    res.status(200).send(html);
    return;
  }
  
  // Regular users get the SPA
  console.log('👤 Regular user - serving SPA HTML');
  
  const spaHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Loading...</title>
  <meta name="robots" content="noindex, nofollow" />
</head>
<body>
  <div id="root"></div>
  <script>
    window.location.reload();
  </script>
</body>
</html>`;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.setHeader('X-User-Type', 'regular');
  res.status(200).send(spaHtml);
}
