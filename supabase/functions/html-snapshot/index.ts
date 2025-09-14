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
      const { data: page, error: pageError } = await supabase
        .from('website_pages')
        .select('*')
        .eq('id', contentId)
        .single()
      
      if (pageError || !page) {
        throw new Error(`Website page not found: ${pageError?.message}`)
      }
      
      const { data: website, error: websiteError } = await supabase
        .from('websites')
        .select('*')
        .eq('id', page.website_id)
        .single()
      
      if (websiteError || !website) {
        throw new Error(`Website not found: ${websiteError?.message}`)
      }
      
      htmlContent = await generateSelfContainedWebsiteHTML(website, page, customDomain)
      
    } else if (contentType === 'funnel_step') {
      const { data: step, error: stepError } = await supabase
        .from('funnel_steps')
        .select('*')
        .eq('id', contentId)
        .single()
      
      if (stepError || !step) {
        throw new Error(`Funnel step not found: ${stepError?.message}`)
      }
      
      const { data: funnel, error: funnelError } = await supabase
        .from('funnels')
        .select('*')
        .eq('id', step.funnel_id)
        .single()
      
      if (funnelError || !funnel) {
        throw new Error(`Funnel not found: ${funnelError?.message}`)
      }
      
      htmlContent = await generateSelfContainedFunnelHTML(funnel, step, customDomain)
    } else {
      throw new Error(`Unsupported content type: ${contentType}`)
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

async function generateSelfContainedWebsiteHTML(website: any, page: any, customDomain?: string): Promise<string> {
  const seoTitle = page.seo_title || page.title || website.name;
  const seoDescription = page.seo_description || 'Discover amazing products';
  
  return await generateCompleteHTML({
    pageData: page.content || {},
    seoConfig: {
      title: seoTitle,
      description: seoDescription,
      ogTitle: page.seo_title || page.title,
      ogDescription: page.seo_description,
      ogImage: page.og_image,
      siteName: website.name
    },
    customDomain,
    websiteSettings: website,
    contentType: 'website_page',
    contentId: page.id
  });
}

async function generateSelfContainedFunnelHTML(funnel: any, step: any, customDomain?: string): Promise<string> {
  const seoTitle = step.seo_title || step.title || funnel.name;
  const seoDescription = step.seo_description || 'High converting sales funnel';
  
  return await generateCompleteHTML({
    pageData: step.content || {},
    seoConfig: {
      title: seoTitle,
      description: seoDescription,
      ogTitle: step.seo_title || step.title,
      ogDescription: step.seo_description,
      ogImage: funnel.og_image,
      siteName: funnel.name
    },
    customDomain,
    funnelSettings: funnel,
    contentType: 'funnel_step',
    contentId: step.id
  });
}

async function generateCompleteHTML(options: any): Promise<string> {
  const { seoConfig, contentType, contentId, customDomain, pageData } = options;
  
  // Get app bundle information
  const bundle = await getAppBundle();
  
  // Generate asset URLs based on custom domain or system domain
  const assetBaseUrl = customDomain 
    ? `https://${customDomain}` 
    : 'https://fhqwacmokbtbspkxjixf.functions.supabase.co/asset-storage';
  
  // Generate CSS link tags
  const cssLinks = bundle.cssFiles.map(file => 
    `<link rel="stylesheet" href="${assetBaseUrl}/${file}">`
  ).join('\n  ');
  
  // Generate JS script tags
  const jsScripts = bundle.jsFiles.map(file => 
    `<script type="module" src="${assetBaseUrl}/${file}"></script>`
  ).join('\n  ');
  
  // Include preload links for better performance
  const preloadLinks = bundle.preloadLinks.replace(/href="([^"]*)"/g, 
    `href="${assetBaseUrl}/$1"`
  );
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${seoConfig.title}</title>
  <meta name="description" content="${seoConfig.description}">
  ${seoConfig.ogTitle ? `<meta property="og:title" content="${seoConfig.ogTitle}">` : ''}
  ${seoConfig.ogDescription ? `<meta property="og:description" content="${seoConfig.ogDescription}">` : ''}
  ${seoConfig.ogImage ? `<meta property="og:image" content="${seoConfig.ogImage}">` : ''}
  <meta property="og:type" content="website">
  <meta name="robots" content="index,follow">
  
  <!-- Preload critical resources -->
  ${preloadLinks}
  
  <!-- CSS Assets -->
  ${cssLinks}
  
  <!-- Critical inline CSS for initial render -->
  <style>
    body { 
      font-family: 'Inter', system-ui, sans-serif; 
      margin: 0; 
      line-height: 1.6;
      color: #333;
    }
    .server-rendered-content {
      min-height: 100vh;
      padding: 2rem;
    }
    .content-section {
      max-width: 1200px;
      margin: 0 auto;
    }
    .hero-section {
      text-align: center;
      padding: 4rem 0;
    }
    .hero-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero-description {
      font-size: 1.125rem;
      color: #6b7280;
      margin-bottom: 2rem;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin: 3rem 0;
    }
    .feature-card {
      padding: 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      background: white;
    }
    .feature-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    .loading-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="server-rendered-content">
      <div class="content-section">
        <div class="hero-section">
          <h1 class="hero-title">${seoConfig.title}</h1>
          <p class="hero-description">${seoConfig.description}</p>
        </div>
        
        <!-- Render actual page content for SEO -->
        ${renderPageContent(pageData)}
      </div>
    </div>
  </div>
  
  <!-- Hydration Data -->
  <script>
    window.__HYDRATION_DATA__ = {
      pageData: ${JSON.stringify(pageData)},
      contentType: '${contentType}',
      contentId: '${contentId}',
      customDomain: ${customDomain ? `'${customDomain}'` : 'null'},
      timestamp: ${Date.now()}
    };
    
    // Mark when assets start loading
    console.log('📦 Loading React assets for hydration...');
  </script>
  
  <!-- React App Assets -->
  ${jsScripts}
</body>
</html>`;
}

async function getAppBundle() {
  try {
    // Fetch the bundle manifest from asset-storage
    const response = await fetch('https://fhqwacmokbtbspkxjixf.functions.supabase.co/asset-storage/bundle-manifest.json');
    if (response.ok) {
      const manifest = await response.json();
      return {
        cssFiles: manifest.cssFiles || [],
        jsFiles: manifest.jsFiles || [],
        preloadLinks: manifest.preloadLinks || ''
      };
    }
  } catch (error) {
    console.warn('Failed to fetch bundle manifest:', error);
  }
  
  // Fallback: try to get known asset files from asset-storage
  const knownAssets = {
    cssFiles: [],
    jsFiles: [],
    preloadLinks: ''
  };
  
  try {
    // Try to fetch common asset files that should exist
    const cssResponse = await fetch('https://fhqwacmokbtbspkxjixf.functions.supabase.co/asset-storage/assets/', { method: 'HEAD' });
    if (cssResponse.ok) {
      // Look for typical Vite build patterns
      knownAssets.cssFiles = ['assets/index.css'];
      knownAssets.jsFiles = ['assets/index.js'];
    }
  } catch (error) {
    console.warn('Failed to check for assets:', error);
  }
  
  return knownAssets;
}

function renderPageContent(pageData: any): string {
  if (!pageData?.sections?.length) {
    return '<div class="text-center"><div class="loading-spinner"></div> Loading content...</div>';
  }
  
  let contentHtml = '';
  
  for (const section of pageData.sections) {
    switch (section.type) {
      case 'hero':
        contentHtml += `
          <section class="hero-section">
            <h2 class="hero-title">${section.content?.title || ''}</h2>
            <p class="hero-description">${section.content?.subtitle || ''}</p>
          </section>
        `;
        break;
        
      case 'content':
      case 'text':
        contentHtml += `
          <section class="content-section">
            <h3 class="feature-title">${section.content?.title || ''}</h3>
            <p>${section.content?.text || section.content?.content || ''}</p>
          </section>
        `;
        break;
        
      case 'featured_products':
        contentHtml += `
          <section class="features-grid">
            <div class="feature-card">
              <h3 class="feature-title">Featured Products</h3>
              <p>Discover our top products carefully selected for you.</p>
            </div>
          </section>
        `;
        break;
        
      default:
        if (section.content?.title) {
          contentHtml += `
            <section class="content-section">
              <h3 class="feature-title">${section.content.title}</h3>
              ${section.content.description ? `<p>${section.content.description}</p>` : ''}
            </section>
          `;
        }
    }
  }
  
  return contentHtml || '<div class="text-center">Welcome to our site!</div>';
}