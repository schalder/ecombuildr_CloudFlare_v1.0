import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const imageUrl = url.searchParams.get('url')
    const width = url.searchParams.get('w')
    const height = url.searchParams.get('h')
    const quality = url.searchParams.get('q') || '85'
    const format = url.searchParams.get('f') || 'auto'

    if (!imageUrl) {
      return new Response('Missing image URL', { status: 400, headers: corsHeaders })
    }

    // Validate that it's a Supabase image URL
    if (!imageUrl.includes('fhqwacmokbtbspkxjixf.supabase.co')) {
      return new Response('Invalid image URL', { status: 400, headers: corsHeaders })
    }

    // Fetch the original image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      return new Response('Failed to fetch image', { status: 404, headers: corsHeaders })
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    
    // For now, return the original image with optimized headers
    // In production, you could add actual image processing here
    return new Response(imageBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': imageBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('Error processing image:', error)
    return new Response('Internal server error', { status: 500, headers: corsHeaders })
  }
})
