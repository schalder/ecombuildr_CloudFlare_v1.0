import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json().catch(() => ({}))
    const { contentType, contentId, customDomain } = body
    
    console.log(`🔍 Generating self-contained HTML for ${contentType}:${contentId}`)

    if (!contentType || !contentId) {
      throw new Error('Missing contentType or contentId in request body')
    }

    let htmlContent = ''
    
    if (contentType === 'website_page') {
      const { data: page } = await supabase.from('website_pages').select('*').eq('id', contentId).single()
      const { data: website } = await supabase.from('websites').select('*').eq('id', page.website_id).single()
      
      htmlContent = generateSelfContainedWebsiteHTML(website, page, customDomain)
      
    } else if (contentType === 'funnel_step') {
      const { data: step } = await supabase.from('funnel_steps').select('*').eq('id', contentId).single()
      const { data: funnel } = await supabase.from('funnels').select('*').eq('id', step.funnel_id).single()
      
      htmlContent = generateSelfContainedFunnelHTML(funnel, step, customDomain)
    }

    // Store the self-contained HTML snapshot
    let query = supabase.from('html_snapshots').select('id').eq('content_id', contentId).eq('content_type', contentType)
    if (customDomain) {
      query = query.eq('custom_domain', customDomain)
    } else {
      query = query.is('custom_domain', null)
    }

    const { data: existingRecord } = await query.maybeSingle()
    
    if (existingRecord) {
      await supabase.from('html_snapshots').update({
        html_content: htmlContent,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', existingRecord.id)
    } else {
      await supabase.from('html_snapshots').insert({
        content_id: contentId,
        content_type: contentType,
        custom_domain: customDomain || null,
        html_content: htmlContent,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Self-contained HTML generated successfully',
      htmlLength: htmlContent.length
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})

function generateSelfContainedWebsiteHTML(website: any, page: any, customDomain?: string): string {
  const seoTitle = page.seo_title || page.title || website.name;
  const seoDescription = page.seo_description || 'Discover amazing products';
  
  return generateCompleteHTML({
    pageData: page.page_data || {},
    seoConfig: {
      title: seoTitle,
      description: seoDescription,
      siteName: website.name
    },
    customDomain,
    websiteSettings: website,
    contentType: 'website_page',
    contentId: page.id
  });
}

function generateSelfContainedFunnelHTML(funnel: any, step: any, customDomain?: string): string {
  const seoTitle = step.seo_title || step.title || funnel.name;
  const seoDescription = step.seo_description || 'High converting sales funnel';
  
  return generateCompleteHTML({
    pageData: step.page_data || {},
    seoConfig: {
      title: seoTitle,
      description: seoDescription,
      siteName: funnel.name
    },
    customDomain,
    funnelSettings: funnel,
    contentType: 'funnel_step',
    contentId: step.id
  });
}

function generateCompleteHTML(options: any): string {
  const { seoConfig, contentType, contentId, customDomain, pageData } = options;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${seoConfig.title}</title>
  <meta name="description" content="${seoConfig.description}">
  
  <!-- Self-contained CSS will be inlined here during build -->
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; margin: 0; }
    .min-h-screen { min-height: 100vh; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .text-center { text-align: center; }
    .text-4xl { font-size: 2.25rem; }
    .font-bold { font-weight: 700; }
    .mb-4 { margin-bottom: 1rem; }
    .text-gray-600 { color: #4b5563; }
  </style>
</head>
<body>
  <div id="root">
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-4">${seoConfig.title}</h1>
        <p class="text-gray-600">${seoConfig.description}</p>
      </div>
    </div>
  </div>
  
  <script>
    window.__HYDRATION_DATA__ = {
      pageData: ${JSON.stringify(pageData)},
      contentType: '${contentType}',
      contentId: '${contentId}',
      customDomain: ${customDomain ? `'${customDomain}'` : 'null'}
    };
    
    // Self-contained React app bundle will be inlined here
    console.log('Self-contained page loaded');
  </script>
</body>
</html>`;
}