import { PageBuilderData } from '@/components/page-builder/types';
import { SEOConfig } from './seo';
import { generateCompleteCSS } from './staticCSS';

export interface HTMLGenerationOptions {
  title?: string;
  seoConfig?: SEOConfig;
  customDomain?: string;
  websiteSettings?: any;
  funnelSettings?: any;
}

export async function generateStaticHTML(
  pageData: PageBuilderData, 
  options: HTMLGenerationOptions = {},
  supabaseClient?: any
): Promise<string> {
  const {
    title = 'Page',
    seoConfig = {},
    customDomain,
    websiteSettings = {},
    funnelSettings = {}
  } = options;

  // Extract page styles for inline CSS
  const pageStyles = generatePageCSS(pageData);
  
  // Generate meta tags
  const metaTags = generateMetaTags(seoConfig, title);
  
  // Generate page content HTML with dynamic data
  const contentHTML = await generatePageContent(pageData, supabaseClient, options);
  
  // Generate structured data if available
  const structuredData = seoConfig.structuredData ? 
    `<script type="application/ld+json">${JSON.stringify(seoConfig.structuredData)}</script>` : '';

  // Include complete CSS from our design system
  const completeCSS = await generateCompleteCSS(pageStyles);

  return `<!DOCTYPE html>
<html lang="${seoConfig.languageCode || 'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  ${metaTags}
  ${seoConfig.canonical ? `<link rel="canonical" href="${seoConfig.canonical}">` : ''}
  ${seoConfig.favicon ? `<link rel="icon" type="image/png" href="${seoConfig.favicon}">` : ''}
  
  <!-- Critical fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <style>
    ${completeCSS}
  </style>
  
  ${structuredData}
  ${seoConfig.customMetaTags && Array.isArray(seoConfig.customMetaTags) ? 
    seoConfig.customMetaTags.map(tag => `<meta name="${tag.name}" content="${tag.content}">`).join('\n') : ''}
</head>
<body>
  ${contentHTML}
  
  <!-- Static HTML interaction scripts -->
  <script>
    // Mobile menu toggle
    function toggleMobileMenu() {
      const menu = document.getElementById('mobile-menu');
      if (menu) {
        menu.classList.toggle('hidden');
      }
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
    
    // Form submission to edge functions
    document.querySelectorAll('form[data-form-type]').forEach(form => {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        const formType = this.getAttribute('data-form-type');
        const storeId = this.getAttribute('data-store-id');
        
        try {
          const response = await fetch('https://fhqwacmokbtbspkxjixf.supabase.co/functions/v1/form-submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, formType, storeId })
          });
          
          if (response.ok) {
            this.innerHTML = '<div class="text-center p-8"><h3 class="text-2xl font-bold text-green-600 mb-4">Thank You!</h3><p class="text-gray-600">We have received your message and will get back to you soon.</p></div>';
          } else {
            throw new Error('Submission failed');
          }
        } catch (error) {
          console.error('Form submission error:', error);
          alert('There was an error submitting your form. Please try again.');
        }
      });
    });
    
    // Intersection observer for animations
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      });
    }, observerOptions);
    
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
  </script>
  
  ${websiteSettings?.customScripts || funnelSettings?.customScripts || ''}
</body>
</html>`;
}

function generateMetaTags(seoConfig: SEOConfig, fallbackTitle: string): string {
  const title = seoConfig.title || fallbackTitle;
  const description = seoConfig.description || 'Welcome to our website';
  const image = seoConfig.socialImageUrl || seoConfig.image;
  
  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    seoConfig.keywords?.length ? `<meta name="keywords" content="${seoConfig.keywords.join(', ')}">` : '',
    seoConfig.author ? `<meta name="author" content="${seoConfig.author}">` : '',
    seoConfig.robots ? `<meta name="robots" content="${seoConfig.robots}">` : '',
    
    // Open Graph
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:type" content="${seoConfig.ogType || 'website'}">`,
    seoConfig.siteName ? `<meta property="og:site_name" content="${seoConfig.siteName}">` : '',
    seoConfig.locale ? `<meta property="og:locale" content="${seoConfig.locale}">` : '',
    image ? `<meta property="og:image" content="${image}">` : '',
    
    // Twitter Card
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    image ? `<meta name="twitter:image" content="${image}">` : ''
  ];
  
  return tags.filter(Boolean).join('\n  ');
}

function generatePageCSS(pageData: PageBuilderData): string {
  let css = '';
  
  // Add page-level styles
  if (pageData.pageStyles) {
    css += `.page-container {
      ${pageData.pageStyles.backgroundColor ? `background-color: ${pageData.pageStyles.backgroundColor};` : ''}
      ${pageData.pageStyles.backgroundImage ? `background-image: url(${pageData.pageStyles.backgroundImage});` : ''}
      ${pageData.pageStyles.backgroundSize ? `background-size: ${pageData.pageStyles.backgroundSize};` : ''}
      ${pageData.pageStyles.backgroundPosition ? `background-position: ${pageData.pageStyles.backgroundPosition};` : ''}
      ${pageData.pageStyles.backgroundRepeat ? `background-repeat: ${pageData.pageStyles.backgroundRepeat};` : ''}
      ${pageData.pageStyles.paddingTop ? `padding-top: ${pageData.pageStyles.paddingTop};` : ''}
      ${pageData.pageStyles.paddingRight ? `padding-right: ${pageData.pageStyles.paddingRight};` : ''}
      ${pageData.pageStyles.paddingBottom ? `padding-bottom: ${pageData.pageStyles.paddingBottom};` : ''}
      ${pageData.pageStyles.paddingLeft ? `padding-left: ${pageData.pageStyles.paddingLeft};` : ''}
      ${pageData.pageStyles.marginTop ? `margin-top: ${pageData.pageStyles.marginTop};` : ''}
      ${pageData.pageStyles.marginRight ? `margin-right: ${pageData.pageStyles.marginRight};` : ''}
      ${pageData.pageStyles.marginBottom ? `margin-bottom: ${pageData.pageStyles.marginBottom};` : ''}
      ${pageData.pageStyles.marginLeft ? `margin-left: ${pageData.pageStyles.marginLeft};` : ''}
    }\n`;
  }
  
  // Add global styles if present
  if (pageData.globalStyles) {
    css += pageData.globalStyles + '\n';
  }
  
  return css;
}

async function generatePageContent(pageData: PageBuilderData, supabaseClient?: any, options: HTMLGenerationOptions = {}): Promise<string> {
  if (!pageData.sections || pageData.sections.length === 0) {
    return '<div class="min-h-screen flex items-center justify-center"><p>No content available</p></div>';
  }
  
  const sectionsHTML = await Promise.all(
    pageData.sections.map(section => generateSectionHTML(section, supabaseClient, options))
  );
  
  return `<div class="page-container min-h-screen">${sectionsHTML.join('\n')}</div>`;
}

async function generateSectionHTML(section: any, supabaseClient?: any, options: HTMLGenerationOptions = {}): Promise<string> {
  const sectionStyles = section.styles ? generateElementStyles(section.styles) : '';
  
  let sectionHTML = `<section class="animate-on-scroll" style="${sectionStyles}">`;
  
  if (section.rows && section.rows.length > 0) {
    const rowsHTML = await Promise.all(
      section.rows.map((row: any) => generateRowHTML(row, supabaseClient, options))
    );
    sectionHTML += rowsHTML.join('\n');
  }
  
  sectionHTML += '</section>';
  return sectionHTML;
}

async function generateRowHTML(row: any, supabaseClient?: any, options: HTMLGenerationOptions = {}): Promise<string> {
  const rowStyles = row.styles ? generateElementStyles(row.styles) : '';
  let rowHTML = `<div class="row" style="${rowStyles}">`;
  
  if (row.columns && row.columns.length > 0) {
    const gridCols = row.columns.length === 1 ? 'grid-cols-1' : 
                    row.columns.length === 2 ? 'md:grid-cols-2' : 
                    row.columns.length === 3 ? 'md:grid-cols-3' : 
                    'md:grid-cols-4';
    
    rowHTML += `<div class="grid ${gridCols} gap-6">`;
    const columnsHTML = await Promise.all(
      row.columns.map((column: any) => generateColumnHTML(column, supabaseClient, options))
    );
    rowHTML += columnsHTML.join('\n');
    rowHTML += '</div>';
  }
  
  rowHTML += '</div>';
  return rowHTML;
}

async function generateColumnHTML(column: any, supabaseClient?: any, options: HTMLGenerationOptions = {}): Promise<string> {
  const columnStyles = column.styles ? generateElementStyles(column.styles) : '';
  let columnHTML = `<div class="column" style="${columnStyles}">`;
  
  if (column.elements && column.elements.length > 0) {
    const elementsHTML = await Promise.all(
      column.elements.map((element: any) => generateElementHTML(element, supabaseClient, options))
    );
    columnHTML += elementsHTML.join('\n');
  }
  
  columnHTML += '</div>';
  return columnHTML;
}

async function generateElementHTML(element: any, supabaseClient?: any, options: HTMLGenerationOptions = {}): Promise<string> {
  const customCSS = element.content?.customCSS;
  const customJS = element.content?.customJS;
  const elementId = element.anchor || `element-${element.id}`;
  
  let elementHTML = '';
  
  switch (element.type) {
    case 'heading':
      elementHTML = generateHeadingHTML(element);
      break;
    case 'paragraph':
      elementHTML = generateParagraphHTML(element);
      break;
    case 'image':
      elementHTML = generateImageHTML(element);
      break;
    case 'button':
      elementHTML = generateButtonHTML(element);
      break;
    case 'products_grid':
      elementHTML = await generateProductsGridHTML(element, supabaseClient, options);
      break;
    case 'hero':
      elementHTML = generateHeroHTML(element);
      break;
    case 'features':
      elementHTML = generateFeaturesHTML(element);
      break;
    case 'contact_form':
      elementHTML = generateContactFormHTML(element, options);
      break;
    default:
      elementHTML = `<div class="element-${element.type}">${element.content?.text || element.content?.title || ''}</div>`;
  }
  
  // Wrap element with container that has the anchor ID if needed
  const needsWrapper = customCSS || customJS || element.anchor;
  let result = needsWrapper ? `<div id="${elementId}">${elementHTML}</div>` : elementHTML;
  
  // Add custom CSS if present
  if (customCSS) {
    result = `<style>
      /* Custom CSS for element ${element.id} */
      #${elementId} { ${customCSS} }
      #${elementId} * { ${customCSS.replace(/([^{]+){([^}]+)}/g, '$2')} }
    </style>` + result;
  }
  
  // Add custom JS if present
  if (customJS) {
    result += `<script>
      (function() {
        const targetElement = document.getElementById('${elementId}');
        if (targetElement) {
          try {
            ${customJS}
          } catch (error) {
            console.error('Custom JS execution error for element ${elementId}:', error);
          }
        }
      })();
    </script>`;
  }
  
  return result;
}

function generateHeadingHTML(element: any): string {
  const level = element.content?.level || 'h1';
  const text = element.content?.text || element.content?.title || 'Heading';
  const styles = element.styles ? generateElementStyles(element.styles) : '';
  
  return `<${level} class="text-responsive mb-4 font-bold animate-fade-in" style="${styles}">${text}</${level}>`;
}

function generateParagraphHTML(element: any): string {
  const text = element.content?.text || 'Paragraph text';
  const styles = element.styles ? generateElementStyles(element.styles) : '';
  
  return `<p class="mb-4 leading-relaxed animate-fade-in" style="${styles}">${text}</p>`;
}

function generateImageHTML(element: any): string {
  const src = element.content?.src || element.content?.url || '';
  const alt = element.content?.alt || 'Image';
  const styles = element.styles ? generateElementStyles(element.styles) : '';
  
  return `<img src="${src}" alt="${alt}" class="max-w-full h-auto rounded-lg animate-fade-in" style="${styles}" loading="lazy">`;
}

function generateButtonHTML(element: any): string {
  const text = element.content?.text || 'Button';
  const href = element.content?.href || element.content?.url || '#';
  const styles = element.styles ? generateElementStyles(element.styles) : '';
  
  return `<a href="${href}" class="btn-primary inline-block animate-fade-in" style="${styles}">${text}</a>`;
}

function generateHeroHTML(element: any): string {
  const title = element.content?.title || 'Welcome';
  const subtitle = element.content?.subtitle || '';
  const ctaText = element.content?.cta || element.content?.buttonText || 'Get Started';
  const ctaLink = element.content?.ctaLink || '#';
  const backgroundImage = element.content?.backgroundImage || element.styles?.backgroundImage;
  
  const bgStyle = backgroundImage ? `background-image: url(${backgroundImage}); background-size: cover; background-position: center;` : '';
  
  return `
    <section class="hero min-h-screen flex items-center justify-center text-center px-responsive animate-slide-up" style="${bgStyle}">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-5xl md:text-6xl font-bold mb-6 text-gray-900">${title}</h1>
        ${subtitle ? `<p class="text-xl mb-8 text-gray-600">${subtitle}</p>` : ''}
        <a href="${ctaLink}" class="btn-primary text-lg px-8 py-4">${ctaText}</a>
      </div>
    </section>
  `;
}

function generateFeaturesHTML(element: any): string {
  const title = element.content?.title || 'Features';
  const features = element.content?.features || [];
  
  return `
    <section class="py-16 px-responsive">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-4xl font-bold text-center mb-12">${title}</h2>
        <div class="grid md:grid-cols-3 gap-8">
          ${features.map((feature: any) => `
            <div class="card text-center animate-fade-in">
              ${feature.icon ? `<div class="text-4xl mb-4">${feature.icon}</div>` : ''}
              <h3 class="text-xl font-semibold mb-4">${feature.title || 'Feature'}</h3>
              <p class="text-gray-600">${feature.description || 'Feature description'}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

async function generateProductsGridHTML(element: any, supabaseClient?: any, options: HTMLGenerationOptions = {}): Promise<string> {
  const title = element.content?.title || 'Products';
  const limit = element.content?.limit || 8;
  const categoryId = element.content?.categoryId;
  
  let products = [];
  
  // Fetch real products if supabase client is available
  if (supabaseClient && options.websiteSettings?.storeId) {
    try {
      let query = supabaseClient
        .from('products')
        .select('id, name, slug, description, price, images, is_active')
        .eq('store_id', options.websiteSettings.storeId)
        .eq('is_active', true)
        .limit(limit);
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data } = await query;
      products = data || [];
    } catch (error) {
      console.error('Error fetching products for static HTML:', error);
    }
  }
  
  const productsHTML = products.length > 0 ? 
    products.map(product => {
      const image = product.images?.[0] || '/placeholder.svg';
      const productUrl = `/products/${product.slug}`;
      
      return `
        <div class="product-card animate-fade-in">
          <a href="${productUrl}" class="block">
            <img src="${image}" alt="${product.name}" class="product-image" loading="lazy">
            <div class="product-info">
              <h3 class="product-title">${product.name}</h3>
              <p class="product-price">৳${product.price}</p>
              ${product.description ? `<p class="text-sm text-gray-600 mt-2">${product.description.substring(0, 80)}...</p>` : ''}
            </div>
          </a>
        </div>
      `;
    }).join('') : 
    `<div class="col-span-full text-center py-12">
      <p class="text-gray-500">No products available at the moment.</p>
    </div>`;
  
  return `
    <section class="py-16 px-4 md:px-8">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-4xl font-bold text-center mb-12">${title}</h2>
        <div class="product-grid">
          ${productsHTML}
        </div>
      </div>
    </section>
  `;
}

function generateContactFormHTML(element: any, options: HTMLGenerationOptions = {}): string {
  const title = element.content?.title || 'Contact Us';
  const subtitle = element.content?.text || 'Get in touch with us';
  const storeId = options.websiteSettings?.storeId || options.funnelSettings?.storeId;
  
  return `
    <section class="py-16 px-responsive">
      <div class="max-w-2xl mx-auto">
        <h2 class="text-4xl font-bold text-center mb-4">${title}</h2>
        <p class="text-center text-gray-600 mb-8">${subtitle}</p>
        <form class="card animate-fade-in">
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input type="text" name="name" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" name="email" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea name="message" rows="4" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
          </div>
          <button type="submit" class="btn-primary w-full">Send Message</button>
        </form>
      </div>
    </section>
  `;
}

function generateElementStyles(styles: any): string {
  if (!styles) return '';
  
  const cssProps = [];
  
  if (styles.color) cssProps.push(`color: ${styles.color}`);
  if (styles.backgroundColor) cssProps.push(`background-color: ${styles.backgroundColor}`);
  if (styles.fontSize) cssProps.push(`font-size: ${styles.fontSize}`);
  if (styles.fontWeight) cssProps.push(`font-weight: ${styles.fontWeight}`);
  if (styles.textAlign) cssProps.push(`text-align: ${styles.textAlign}`);
  if (styles.padding) cssProps.push(`padding: ${styles.padding}`);
  if (styles.margin) cssProps.push(`margin: ${styles.margin}`);
  if (styles.border) cssProps.push(`border: ${styles.border}`);
  if (styles.borderRadius) cssProps.push(`border-radius: ${styles.borderRadius}`);
  if (styles.width) cssProps.push(`width: ${styles.width}`);
  if (styles.height) cssProps.push(`height: ${styles.height}`);
  if (styles.backgroundImage) cssProps.push(`background-image: url(${styles.backgroundImage})`);
  
  return cssProps.join('; ');
}