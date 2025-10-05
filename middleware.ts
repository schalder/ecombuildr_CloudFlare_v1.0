import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  const { pathname, hostname } = req.nextUrl;
  const userAgent = req.headers.get('user-agent') || '';

  // Check if this is a social crawler
  const isSocialCrawler = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|whatsapp|linkedinbot|slackbot|discordbot|telegrambot|skypeuripreview|facebookcatalog/i.test(userAgent);

  // Check if this is a custom domain (not our main domains)
  const isCustomDomain = !hostname.includes('ecombuildr.com') && 
                        !hostname.includes('localhost') && 
                        !hostname.includes('lovable.dev') &&
                        !hostname.includes('lovable.app') &&
                        !hostname.includes('lovableproject.com') &&
                        !hostname.includes('vercel.app') &&
                        !hostname.includes('netlify.app');

  console.log('Edge Function called:', {
    hostname,
    pathname,
    userAgent,
    isSocialCrawler,
    isCustomDomain
  });

  // If it's a social crawler on a custom domain, fetch SEO data from Supabase Edge Function
  if (isSocialCrawler && isCustomDomain) {
    try {
      const seoUrl = `https://fhqwacmokbtbspkxjixf.supabase.co/functions/v1/seo-meta-injection?domain=${encodeURIComponent(hostname)}&path=${encodeURIComponent(pathname)}`;
      
      console.log('Fetching SEO data from:', seoUrl);
      
      const response = await fetch(seoUrl, {
        headers: {
          'User-Agent': userAgent,
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM'
        }
      });

      if (response.ok) {
        const html = await response.text();
        console.log('Returning SEO HTML for social crawler');
        return new NextResponse(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=300'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching SEO data:', error);
    }
  }

  // For all other requests, continue to the static files
  return NextResponse.next();
}
