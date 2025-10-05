// Cloudflare Worker for Smart SEO Routing
// This worker detects social crawlers and routes them to Supabase Edge Function
// Regular users get routed to Vercel for full functionality

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const userAgent = request.headers.get('user-agent') || ''
  
  // Check if this is a social crawler
  const isSocialCrawler = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|whatsapp|linkedinbot|slackbot|discordbot|telegrambot|skypeuripreview|facebookcatalog/i.test(userAgent)
  
  // Check if this is a custom domain (not our main domains)
  const isCustomDomain = !url.hostname.includes('ecombuildr.com') && 
                        !url.hostname.includes('localhost') && 
                        !url.hostname.includes('lovable.dev') &&
                        !url.hostname.includes('lovable.app') &&
                        !url.hostname.includes('lovableproject.com') &&
                        !url.hostname.includes('vercel.app') &&
                        !url.hostname.includes('netlify.app')
  
  console.log('Cloudflare Worker:', {
    hostname: url.hostname,
    pathname: url.pathname,
    userAgent,
    isSocialCrawler,
    isCustomDomain
  })
  
  // If it's a social crawler on a custom domain, route to Supabase Edge Function
  if (isSocialCrawler && isCustomDomain) {
    try {
      const seoUrl = `https://fhqwacmokbtbspkxjixf.supabase.co/functions/v1/seo-meta-injection?domain=${encodeURIComponent(url.hostname)}&path=${encodeURIComponent(url.pathname)}`
      
      console.log('Routing social crawler to SEO Edge Function:', seoUrl)
      
      const response = await fetch(seoUrl, {
        headers: {
          'User-Agent': userAgent,
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM'
        }
      })
      
      if (response.ok) {
        const html = await response.text()
        console.log('Returning SEO HTML for social crawler')
        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=300'
          }
        })
      } else {
        console.error('SEO Edge Function returned error:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching SEO data:', error)
    }
  }
  
  // For all other requests (regular users), route to Vercel
  const vercelUrl = `https://f-commerce-builder-git-main-schalder.vercel.app${url.pathname}${url.search}`
  
  console.log('Routing regular user to Vercel:', vercelUrl)
  
  // Forward the request to Vercel with original headers
  const modifiedRequest = new Request(vercelUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  })
  
  return fetch(modifiedRequest)
}
