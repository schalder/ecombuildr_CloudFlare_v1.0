// Simplified Cloudflare Worker for SEO Routing
// Deploy this directly in Cloudflare Dashboard

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const userAgent = request.headers.get('user-agent') || ''
    
    // Social crawler detection
    const isSocialCrawler = /facebookexternalhit|twitterbot|whatsapp|linkedinbot|slackbot|discordbot|telegrambot/i.test(userAgent)
    
    // Custom domain detection
    const isCustomDomain = !url.hostname.includes('ecombuildr.com') && 
                          !url.hostname.includes('vercel.app') &&
                          !url.hostname.includes('netlify.app')
    
    // Route social crawlers to SEO Edge Function
    if (isSocialCrawler && isCustomDomain) {
      const seoUrl = `https://fhqwacmokbtbspkxjixf.supabase.co/functions/v1/seo-meta-injection?domain=${encodeURIComponent(url.hostname)}&path=${encodeURIComponent(url.pathname)}`
      
      try {
        const response = await fetch(seoUrl, {
          headers: {
            'User-Agent': userAgent,
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM'
          }
        })
        
        if (response.ok) {
          return new Response(await response.text(), {
            headers: { 'Content-Type': 'text/html' }
          })
        }
      } catch (error) {
        console.error('SEO fetch failed:', error)
      }
    }
    
    // Route regular users to Vercel
    const vercelUrl = `https://f-commerce-builder-git-main-schalder.vercel.app${url.pathname}${url.search}`
    return fetch(vercelUrl, request)
  }
}
