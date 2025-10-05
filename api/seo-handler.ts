import { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url, headers } = req;
  const userAgent = headers['user-agent'] || '';
  const host = headers.host || '';
  
  // Parse the URL to get pathname
  let pathname = '/';
  try {
    const urlObj = new URL(url, `https://${host}`);
    pathname = urlObj.pathname;
  } catch (error) {
    console.error('Error parsing URL:', error);
  }

  // Check if this is a social crawler
  const isSocialCrawler = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|whatsapp|linkedinbot|slackbot|discordbot|telegrambot|skypeuripreview|facebookcatalog/i.test(userAgent);

  // Check if this is a custom domain (not our main domains)
  const isCustomDomain = !host.includes('ecombuildr.com') && 
                        !host.includes('localhost') && 
                        !host.includes('lovable.dev') &&
                        !host.includes('lovable.app') &&
                        !host.includes('lovableproject.com') &&
                        !host.includes('vercel.app') &&
                        !host.includes('netlify.app');

  console.log('SEO Handler called:', {
    method,
    host,
    pathname,
    userAgent,
    isSocialCrawler,
    isCustomDomain
  });

  // If it's a social crawler on a custom domain, fetch SEO data from Supabase Edge Function
  if (isSocialCrawler && isCustomDomain) {
    try {
      const seoUrl = `https://fhqwacmokbtbspkxjixf.supabase.co/functions/v1/seo-meta-injection?domain=${encodeURIComponent(host)}&path=${encodeURIComponent(pathname)}`;
      
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
        return res.status(200).send(html);
      } else {
        console.error('SEO Edge Function returned error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching SEO data:', error);
    }
  }

  // For all other requests, serve the static files
  try {
    // Try to serve static files
    const filePath = join(process.cwd(), 'dist', 'index.html');
    const html = readFileSync(filePath, 'utf8');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error serving static file:', error);
    return res.status(404).json({
      error: 'Not found',
      message: 'Static file not found'
    });
  }
}
