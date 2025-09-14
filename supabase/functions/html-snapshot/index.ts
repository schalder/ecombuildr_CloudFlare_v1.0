import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Static CSS for generated pages
const generateCompleteCSS = (customPageStyles?: string): string => {
  return `
    /* CSS Variables - Design System */
    :root {
      --background: 0 0% 100%;
      --foreground: 215 25% 15%;
      --primary: 185 85% 25%;
      --primary-foreground: 0 0% 98%;
      --primary-glow: 185 85% 35%;
      --accent: 25 95% 55%;
      --accent-foreground: 0 0% 98%;
      --success: 142 76% 36%;
      --muted: 220 30% 96%;
      --muted-foreground: 215 20% 50%;
      --border: 220 25% 90%;
      --ring: 185 85% 25%;
      --radius: 0.5rem;
    }

    /* Base Styles */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      line-height: 1.6;
      color: hsl(var(--foreground));
      background-color: hsl(var(--background));
    }

    /* Typography */
    h1, h2, h3, h4, h5, h6 {
      font-weight: 600;
      line-height: 1.2;
      margin-bottom: 1rem;
    }

    h1 { font-size: 2.5rem; }
    h2 { font-size: 2rem; }
    h3 { font-size: 1.5rem; }
    h4 { font-size: 1.25rem; }
    h5 { font-size: 1.125rem; }
    h6 { font-size: 1rem; }

    p {
      margin-bottom: 1rem;
      line-height: 1.6;
    }

    /* Layout Classes */
    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .section {
      padding: 4rem 0;
    }

    .grid {
      display: grid;
      gap: 1.5rem;
    }

    .grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

    /* Responsive Grid */
    @media (min-width: 768px) {
      .md\\:grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
      .md\\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
      .md\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
      .md\\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
    }

    /* Utility Classes */
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }

    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }

    .text-sm { font-size: 0.875rem; }
    .text-lg { font-size: 1.125rem; }
    .text-xl { font-size: 1.25rem; }
    .text-2xl { font-size: 1.5rem; }
    .text-3xl { font-size: 1.875rem; }
    .text-4xl { font-size: 2.25rem; }
    .text-5xl { font-size: 3rem; }
    .text-6xl { font-size: 3.75rem; }

    /* Spacing */
    .p-4 { padding: 1rem; }
    .p-8 { padding: 2rem; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .px-8 { padding-left: 2rem; padding-right: 2rem; }
    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
    .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
    .py-16 { padding-top: 4rem; padding-bottom: 4rem; }

    .m-4 { margin: 1rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    .mb-12 { margin-bottom: 3rem; }
    .mt-2 { margin-top: 0.5rem; }

    /* Colors */
    .text-gray-600 { color: hsl(var(--muted-foreground)); }
    .text-gray-700 { color: hsl(215 20% 45%); }
    .text-gray-900 { color: hsl(var(--foreground)); }
    .text-green-600 { color: hsl(var(--success)); }

    /* Layout */
    .min-h-screen { min-height: 100vh; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .max-w-2xl { max-width: 42rem; }
    .max-w-4xl { max-width: 56rem; }
    .max-w-6xl { max-width: 72rem; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .w-full { width: 100%; }
    .h-auto { height: auto; }
    .block { display: block; }
    .inline-block { display: inline-block; }

    /* Borders */
    .rounded-lg { border-radius: 0.5rem; }
    .rounded { border-radius: 0.25rem; }
    .border { border-width: 1px; border-style: solid; }
    .border-gray-300 { border-color: hsl(var(--border)); }

    /* Component Styles */
    .btn-primary {
      background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)));
      color: hsl(var(--primary-foreground));
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius);
      font-weight: 600;
      text-decoration: none;
      display: inline-block;
      transition: all 0.2s ease;
      border: none;
      cursor: pointer;
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 25px hsl(var(--primary) / 0.3);
    }

    .card {
      background: hsl(var(--background));
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px hsl(var(--primary) / 0.1);
      border: 1px solid hsl(var(--border));
    }

    /* Product Grid */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2rem;
      padding: 2rem 0;
    }

    .product-card {
      background: hsl(var(--background));
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px hsl(var(--primary) / 0.1);
      transition: transform 0.3s, box-shadow 0.3s;
      border: 1px solid hsl(var(--border));
    }

    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 25px -5px hsl(var(--primary) / 0.15);
    }

    .product-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .product-info {
      padding: 1.5rem;
    }

    .product-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: hsl(var(--foreground));
    }

    .product-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: hsl(var(--primary));
    }

    /* Forms */
    input, textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid hsl(var(--border));
      border-radius: var(--radius);
      font-size: 1rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    input:focus, textarea:focus {
      outline: none;
      border-color: hsl(var(--ring));
      box-shadow: 0 0 0 3px hsl(var(--ring) / 0.1);
    }

    label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: hsl(var(--foreground));
    }

    /* Form Spacing */
    .space-y-6 > * + * {
      margin-top: 1.5rem;
    }

    /* Animations */
    .animate-fade-in {
      animation: fadeIn 0.6s ease-out;
    }

    .animate-slide-up {
      animation: slideUp 0.8s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(40px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-on-scroll {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }

    .animate-on-scroll.animate-fade-in {
      opacity: 1;
      transform: translateY(0);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .container {
        padding: 0 1rem;
      }

      .py-16 {
        padding-top: 2rem;
        padding-bottom: 2rem;
      }

      .text-4xl {
        font-size: 1.875rem;
      }

      .text-5xl {
        font-size: 2.25rem;
      }

      .text-6xl {
        font-size: 2.5rem;
      }

      .px-responsive {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      .text-responsive {
        font-size: 1.25rem;
        line-height: 1.75rem;
      }

      .grid {
        gap: 1rem;
      }

      .product-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
      }
    }

    @media (max-width: 480px) {
      .product-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Hero Section */
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 4rem 1rem;
      background: linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%);
    }

    /* Additional utility classes */
    .col-span-full { grid-column: 1 / -1; }
    .leading-relaxed { line-height: 1.625; }
    .max-w-full { max-width: 100%; }
    .overflow-hidden { overflow: hidden; }

    /* Page container styles */
    .page-container {
      min-height: 100vh;
    }

    .row {
      padding: 1rem 0;
    }

    .column {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Custom page styles */
    ${customPageStyles || ''}
  `;
}

// Static HTML generator
async function generateStaticHTML(pageData: any, options: any = {}, supabaseClient?: any): Promise<string> {
  const { title, seoConfig, customDomain } = options;
  
  // Generate CSS
  const css = generateCompleteCSS(pageData.globalStyles);
  
  // Generate meta tags
  const metaTags = generateMetaTags(seoConfig, title || 'Page');
  
  // Generate page content
  const content = await generatePageContent(pageData, supabaseClient, options);
  
  // Generate complete HTML
  return `<!DOCTYPE html>
<html lang="${seoConfig?.languageCode || 'en'}">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${metaTags}
    <style>${css}</style>
    ${seoConfig?.customMetaTags || ''}
</head>
<body>
    <div class="page-container">
        ${content}
    </div>
    <script>
        // Add scroll animations
        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                }
            });
        };
        
        const observer = new IntersectionObserver(observerCallback, { threshold: 0.1 });
        document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
        
        // Handle form submissions
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    const response = await fetch('https://fhqwacmokbtbspkxjixf.supabase.co/functions/v1/form-submit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM'
                        },
                        body: JSON.stringify(data)
                    });
                    
                    if (response.ok) {
                        alert('Thank you! Your message has been sent.');
                        form.reset();
                    } else {
                        alert('There was an error sending your message. Please try again.');
                    }
                } catch (error) {
                    alert('There was an error sending your message. Please try again.');
                }
            });
        });
    </script>
</body>
</html>`;
}

function generateMetaTags(seoConfig: any, fallbackTitle: string): string {
  if (!seoConfig) {
    return `<title>${fallbackTitle}</title>`;
  }

  const title = seoConfig.title || fallbackTitle;
  const description = seoConfig.description || '';
  const keywords = Array.isArray(seoConfig.keywords) ? seoConfig.keywords.join(', ') : seoConfig.keywords || '';
  const canonical = seoConfig.canonical || '';
  const robots = seoConfig.robots || 'index,follow';
  const author = seoConfig.author || '';
  const language = seoConfig.languageCode || 'en';
  const socialImage = seoConfig.socialImageUrl || '';

  return `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    ${keywords ? `<meta name="keywords" content="${keywords}" />` : ''}
    ${author ? `<meta name="author" content="${author}" />` : ''}
    <meta name="robots" content="${robots}" />
    ${canonical ? `<link rel="canonical" href="${canonical}" />` : ''}
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    ${canonical ? `<meta property="og:url" content="${canonical}" />` : ''}
    ${socialImage ? `<meta property="og:image" content="${socialImage}" />` : ''}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${socialImage ? `<meta name="twitter:image" content="${socialImage}" />` : ''}
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "${title}",
      "description": "${description}"${canonical ? `,"url": "${canonical}"` : ''}
    }
    </script>
  `.trim();
}

async function generatePageContent(pageData: any, supabaseClient?: any, options: any = {}): Promise<string> {
  const { sections = [] } = pageData;
  
  const sectionsHTML = await Promise.all(
    sections.map((section: any) => generateSectionHTML(section, supabaseClient, options))
  );
  
  return sectionsHTML.join('\n');
}

async function generateSectionHTML(section: any, supabaseClient?: any, options: any = {}): Promise<string> {
  const { id, settings = {}, rows = [] } = section;
  const sectionStyles = generateElementStyles(settings.styles || {});
  
  const rowsHTML = await Promise.all(
    rows.map((row: any) => generateRowHTML(row, supabaseClient, options))
  );
  
  return `
    <section class="section animate-on-scroll" id="${id}" style="${sectionStyles}">
      <div class="container">
        ${rowsHTML.join('\n')}
      </div>
    </section>
  `;
}

async function generateRowHTML(row: any, supabaseClient?: any, options: any = {}): Promise<string> {
  const { id, settings = {}, columns = [] } = row;
  const rowStyles = generateElementStyles(settings.styles || {});
  
  const columnsHTML = await Promise.all(
    columns.map((column: any) => generateColumnHTML(column, supabaseClient, options))
  );
  
  const gridClass = `grid grid-cols-${columns.length} md:grid-cols-${columns.length}`;
  
  return `
    <div class="row ${gridClass}" id="${id}" style="${rowStyles}">
      ${columnsHTML.join('\n')}
    </div>
  `;
}

async function generateColumnHTML(column: any, supabaseClient?: any, options: any = {}): Promise<string> {
  const { id, settings = {}, elements = [] } = column;
  const columnStyles = generateElementStyles(settings.styles || {});
  
  const elementsHTML = await Promise.all(
    elements.map((element: any) => generateElementHTML(element, supabaseClient, options))
  );
  
  return `
    <div class="column" id="${id}" style="${columnStyles}">
      ${elementsHTML.join('\n')}
    </div>
  `;
}

async function generateElementHTML(element: any, supabaseClient?: any, options: any = {}): Promise<string> {
  const { type, content = {}, settings = {} } = element;
  const elementStyles = generateElementStyles(settings.styles || {});
  
  switch (type) {
    case 'heading':
      const level = content.level || 1;
      const text = content.text || '';
      return `<h${level} style="${elementStyles}">${text}</h${level}>`;
      
    case 'paragraph':
      return `<p style="${elementStyles}">${content.text || ''}</p>`;
      
    case 'image':
      const alt = content.alt || '';
      const src = content.src || '';
      return `<img src="${src}" alt="${alt}" class="w-full h-auto" style="${elementStyles}" />`;
      
    case 'button':
      const buttonText = content.text || 'Click me';
      const buttonUrl = content.url || '#';
      return `<a href="${buttonUrl}" class="btn-primary" style="${elementStyles}">${buttonText}</a>`;
      
    case 'products_grid':
      return generateProductsGridHTML(content, supabaseClient, options);
      
    case 'contact_form':
      return generateContactFormHTML(content, options);
      
    default:
      return `<div style="${elementStyles}">${content.text || ''}</div>`;
  }
}

async function generateProductsGridHTML(content: any, supabaseClient?: any, options: any = {}): Promise<string> {
  if (!supabaseClient) {
    return '<div class="text-center p-8">Products loading...</div>';
  }

  try {
    const storeId = options.websiteSettings?.storeId || options.funnelSettings?.storeId;
    if (!storeId) {
      return '<div class="text-center p-8">No store configured</div>';
    }

    const { data: products, error } = await supabaseClient
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .limit(12);

    if (error || !products?.length) {
      return '<div class="text-center p-8">No products found</div>';
    }

    const productsHTML = products.map((product: any) => `
      <div class="product-card">
        ${product.image_url ? `<img src="${product.image_url}" alt="${product.name}" class="product-image" />` : ''}
        <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <p class="text-gray-600 mb-4">${product.description || ''}</p>
          <div class="product-price">$${product.price}</div>
        </div>
      </div>
    `).join('');

    return `
      <div class="product-grid">
        ${productsHTML}
      </div>
    `;
  } catch (error) {
    console.error('Error generating products grid:', error);
    return '<div class="text-center p-8">Error loading products</div>';
  }
}

function generateContactFormHTML(content: any, options: any = {}): string {
  return `
    <div class="max-w-2xl mx-auto">
      <form class="space-y-6">
        <div>
          <label for="name">Name</label>
          <input type="text" id="name" name="name" required />
        </div>
        <div>
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required />
        </div>
        <div>
          <label for="message">Message</label>
          <textarea id="message" name="message" rows="4" required></textarea>
        </div>
        <button type="submit" class="btn-primary">Send Message</button>
      </form>
    </div>
  `;
}

function generateElementStyles(styles: any): string {
  if (!styles || typeof styles !== 'object') return '';
  
  const cssProps = [];
  
  Object.entries(styles).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      cssProps.push(`${cssKey}: ${value}`);
    }
  });
  
  return cssProps.join('; ');
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
    
    console.log(`🔍 Generating HTML snapshot for ${contentType}:${contentId}`)
    console.log(`📋 Request body:`, { contentType, contentId, customDomain })

    if (!contentType || !contentId) {
      throw new Error('Missing contentType or contentId in request body')
    }

    let htmlContent = ''
    
    try {
      if (contentType === 'website_page') {
        // Fetch specific website page
        console.log(`📄 Fetching website page: ${contentId}`)
        const { data: page, error: pageError } = await supabase
          .from('website_pages')
          .select('*')
          .eq('id', contentId)
          .maybeSingle()

        if (pageError) {
          console.error('❌ Error fetching website page:', pageError)
          throw new Error(`Error fetching website page: ${pageError.message}`)
        }

        if (!page) {
          console.error('❌ Website page not found:', contentId)
          throw new Error('Website page not found')
        }

        console.log(`✅ Found website page: ${page.title} (website_id: ${page.website_id})`)

        // Fetch the related website separately
        console.log(`🌐 Fetching website: ${page.website_id}`)
        const { data: website, error: websiteError } = await supabase
          .from('websites')
          .select('*')
          .eq('id', page.website_id)
          .maybeSingle()

        if (websiteError) {
          console.error('❌ Error fetching website:', websiteError)
          throw new Error(`Error fetching website: ${websiteError.message}`)
        }

        if (!website) {
          console.error('❌ Website not found for page:', page.website_id)
          throw new Error('Website not found for page')
        }

        console.log(`✅ Found website: ${website.name}`)
        console.log(`🎨 Generating HTML for page: ${page.title}`)
        
        // Prepare page data structure that matches PageBuilderData
        const pageData = {
          sections: page.content?.sections || [],
          pageStyles: page.content?.pageStyles || {},
          globalStyles: page.content?.globalStyles || '',
          storeId: website.store_id
        };
        
        const seoConfig = {
          title: page.seo_title || page.title,
          description: page.seo_description || '',
          keywords: page.seo_keywords || [],
          canonical: page.canonical_url,
          robots: page.meta_robots,
          author: page.meta_author,
          languageCode: page.language_code,
          socialImageUrl: page.og_image || page.social_image_url,
          customMetaTags: page.custom_meta_tags
        };
        
        console.log(`🎯 Using SEO config:`, seoConfig);
        
        htmlContent = await generateStaticHTML(pageData, {
          title: seoConfig.title,
          seoConfig,
          customDomain,
          websiteSettings: { storeId: website.store_id }
        }, supabase);
        
      } else if (contentType === 'funnel_step') {
        // Fetch specific funnel step
        console.log(`📄 Fetching funnel step: ${contentId}`)
        const { data: step, error: stepError } = await supabase
          .from('funnel_steps')
          .select('*')
          .eq('id', contentId)
          .maybeSingle()

        if (stepError) {
          console.error('❌ Error fetching funnel step:', stepError)
          throw new Error(`Error fetching funnel step: ${stepError.message}`)
        }

        if (!step) {
          console.error('❌ Funnel step not found:', contentId)
          throw new Error('Funnel step not found')
        }

        console.log(`✅ Found funnel step: ${step.title} (funnel_id: ${step.funnel_id})`)

        // Fetch the related funnel
        console.log(`🎯 Fetching funnel: ${step.funnel_id}`)
        const { data: funnel, error: funnelError } = await supabase
          .from('funnels')
          .select('*')
          .eq('id', step.funnel_id)
          .maybeSingle()

        if (funnelError) {
          console.error('❌ Error fetching funnel:', funnelError)
          throw new Error(`Error fetching funnel: ${funnelError.message}`)
        }

        if (!funnel) {
          console.error('❌ Funnel not found for step:', step.funnel_id)
          throw new Error('Funnel not found for step')
        }

        console.log(`✅ Found funnel: ${funnel.name}`)
        console.log(`🎨 Generating HTML for step: ${step.title}`)
        
        // Prepare page data structure that matches PageBuilderData
        const pageData = {
          sections: step.content?.sections || [],
          pageStyles: step.content?.pageStyles || {},
          globalStyles: step.content?.globalStyles || '',
          storeId: funnel.store_id
        };
        
        const seoConfig = {
          title: step.seo_title || step.title,
          description: step.seo_description || '',
          keywords: step.seo_keywords || [],
          canonical: step.canonical_url,
          robots: step.meta_robots,
          author: step.meta_author,
          languageCode: step.language_code,
          socialImageUrl: step.og_image || step.social_image_url,
          customMetaTags: step.custom_meta_tags
        };
        
        console.log(`🎯 Using SEO config:`, seoConfig);
        
        htmlContent = await generateStaticHTML(pageData, {
          title: seoConfig.title,
          seoConfig,
          customDomain,
          funnelSettings: { storeId: funnel.store_id }
        }, supabase);
        
      } else {
        throw new Error(`Unsupported content type: ${contentType}`)
      }

      console.log(`📝 Generated HTML content length: ${htmlContent.length}`)
      
    } catch (dataError) {
      console.error('❌ Error fetching data:', dataError)
      throw dataError
    }

    // Store the snapshot using manual update/insert approach to avoid constraint issues
    console.log(`💾 Storing HTML snapshot: ${contentType}:${contentId}`)
    
    try {
      // First, check if a record already exists
      let query = supabase
        .from('html_snapshots')
        .select('id')
        .eq('content_id', contentId)
        .eq('content_type', contentType)

      if (customDomain) {
        query = query.eq('custom_domain', customDomain)
      } else {
        query = query.is('custom_domain', null)
      }

      const { data: existingRecord, error: selectError } = await query.maybeSingle()
      
      if (selectError) {
        console.error('❌ Error checking existing record:', selectError)
        throw selectError
      }

      let result
      if (existingRecord) {
        // Update existing record
        console.log(`🔄 Updating existing snapshot: ${existingRecord.id}`)
        result = await supabase
          .from('html_snapshots')
          .update({
            html_content: htmlContent,
            generated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id)
      } else {
        // Insert new record
        console.log(`✨ Creating new snapshot`)
        result = await supabase
          .from('html_snapshots')
          .insert({
            content_id: contentId,
            content_type: contentType,
            custom_domain: customDomain || null,
            html_content: htmlContent,
            generated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }

      if (result.error) {
        console.error('❌ Database error:', result.error)
        throw result.error
      }

      console.log('✅ HTML snapshot stored successfully')
      
    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError)
      throw dbError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'HTML snapshot generated successfully',
        contentType,
        contentId,
        htmlLength: htmlContent.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Error generating HTML snapshot:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

function generateWebsiteHTML(website: any, page: any, customDomain?: string): string {
  // Use ONLY page-level SEO data (no fallbacks to website-level)
  const title = page.seo_title || page.title || website.name
  const description = page.seo_description || 'Discover amazing products'
  const image = page.og_image || page.social_image_url
  const keywords = (page.seo_keywords || []).join(', ')
  const canonical = page.canonical_url || (customDomain ? `https://${customDomain}` : `https://ecombuildr.com/w/${website.slug}/${page.slug}`)
  const robots = page.meta_robots || 'index,follow'
  const author = page.meta_author
  const language = page.language_code || 'en'

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    ${keywords ? `<meta name="keywords" content="${keywords}" />` : ''}
    ${author ? `<meta name="author" content="${author}" />` : ''}
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${canonical}" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    ${image ? `<meta property="og:image" content="${image}" />` : ''}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${image ? `<meta name="twitter:image" content="${image}" />` : ''}
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "${title}",
      "description": "${description}",
      "url": "${canonical}"
    }
    </script>
    
    ${website.facebook_pixel_id ? `<script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${website.facebook_pixel_id}');
      fbq('track', 'PageView');
    </script>` : ''}
    
    ${page.custom_scripts || ''}
</head>
<body>
    <div id="root">
        <main>
            <h1>${title}</h1>
            <p>${description}</p>
            <div id="loading">Loading page content...</div>
        </main>
    </div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`
}

function generateFunnelHTML(funnel: any, step: any, customDomain?: string): string {
  // Use ONLY step-level SEO data (no fallbacks to funnel-level)
  const title = step.seo_title || step.title || funnel.name
  const description = step.seo_description || 'High converting sales funnel'
  const image = step.og_image || step.social_image_url
  const keywords = (step.seo_keywords || []).join(', ')
  const canonical = step.canonical_url || (customDomain ? `https://${customDomain}` : `https://ecombuildr.com/f/${funnel.slug}/${step.slug}`)
  const robots = step.meta_robots || 'index,follow'
  const author = step.meta_author
  const language = step.language_code || 'en'

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    ${keywords ? `<meta name="keywords" content="${keywords}" />` : ''}
    ${author ? `<meta name="author" content="${author}" />` : ''}
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${canonical}" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    ${image ? `<meta property="og:image" content="${image}" />` : ''}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${image ? `<meta name="twitter:image" content="${image}" />` : ''}
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "${title}",
      "description": "${description}",
      "url": "${canonical}"
    }
    </script>
    
    ${step.custom_scripts || ''}
</head>
<body>
    <div id="root">
        <main>
            <h1>${title}</h1>
            <p>${description}</p>
            <div id="loading">Loading funnel step...</div>
        </main>
    </div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`
}