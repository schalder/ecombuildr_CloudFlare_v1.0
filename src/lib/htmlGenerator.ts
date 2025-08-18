import { PageBuilderData } from '@/components/page-builder/types';
import { SEOConfig } from './seo';

export interface HTMLGenerationOptions {
  title?: string;
  seoConfig?: SEOConfig;
  customDomain?: string;
  websiteSettings?: any;
  funnelSettings?: any;
}

export function generateStaticHTML(
  pageData: PageBuilderData, 
  options: HTMLGenerationOptions = {}
): string {
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
  
  // Generate page content HTML
  const contentHTML = generatePageContent(pageData);
  
  // Generate structured data if available
  const structuredData = seoConfig.structuredData ? 
    `<script type="application/ld+json">${JSON.stringify(seoConfig.structuredData)}</script>` : '';

  return `<!DOCTYPE html>
<html lang="${seoConfig.languageCode || 'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  ${metaTags}
  ${seoConfig.canonical ? `<link rel="canonical" href="${seoConfig.canonical}">` : ''}
  ${seoConfig.favicon ? `<link rel="icon" type="image/png" href="${seoConfig.favicon}">` : ''}
  
  <!-- Load fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS via CDN for static HTML -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <style>
    ${pageStyles}
    
    /* Base styles */
    body { font-family: 'Inter', sans-serif; }
    
    /* Animation classes */
    .animate-fade-in { animation: fadeIn 0.6s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    
    .animate-slide-up { animation: slideUp 0.8s ease-out; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
    
    /* Responsive utilities */
    @media (max-width: 768px) {
      .hide-mobile { display: none !important; }
      .text-responsive { font-size: 1.25rem !important; line-height: 1.75rem !important; }
      .px-responsive { padding-left: 1rem !important; padding-right: 1rem !important; }
    }
    
    /* Component styles */
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-block;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
    }
    
    .card {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    /* Product grid styles */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2rem;
      padding: 2rem 0;
    }
    
    .product-card {
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
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
      color: #1f2937;
    }
    
    .product-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: #3b82f6;
    }
  </style>
  
  ${structuredData}
  ${seoConfig.customMetaTags?.map(tag => `<meta name="${tag.name}" content="${tag.content}">`).join('\n') || ''}
</head>
<body>
  ${contentHTML}
  
  <!-- Basic interaction scripts for static HTML -->
  <script>
    // Handle mobile menu toggle
    function toggleMobileMenu() {
      const menu = document.getElementById('mobile-menu');
      if (menu) {
        menu.classList.toggle('hidden');
      }
    }
    
    // Handle smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
    
    // Simple form submission handler
    document.querySelectorAll('form').forEach(form => {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        // In static version, forms would need to submit to a separate endpoint
        alert('Thank you for your message! We will get back to you soon.');
      });
    });
    
    // Add fade-in animation on scroll
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
  ${seoConfig.customMetaTags?.find(tag => tag.name === 'custom-scripts')?.content || ''}
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

function generatePageContent(pageData: PageBuilderData): string {
  if (!pageData.sections || pageData.sections.length === 0) {
    return '<div class="min-h-screen flex items-center justify-center"><p>No content available</p></div>';
  }
  
  const sectionsHTML = pageData.sections.map(section => generateSectionHTML(section)).join('\n');
  
  return `<div class="page-container min-h-screen">${sectionsHTML}</div>`;
}

function generateSectionHTML(section: any): string {
  const sectionStyles = section.styles ? generateElementStyles(section.styles) : '';
  
  let sectionHTML = `<section class="animate-on-scroll" style="${sectionStyles}">`;
  
  if (section.rows && section.rows.length > 0) {
    sectionHTML += section.rows.map((row: any) => generateRowHTML(row)).join('\n');
  }
  
  sectionHTML += '</section>';
  return sectionHTML;
}

function generateRowHTML(row: any): string {
  const rowStyles = row.styles ? generateElementStyles(row.styles) : '';
  let rowHTML = `<div class="row" style="${rowStyles}">`;
  
  if (row.columns && row.columns.length > 0) {
    const gridCols = row.columns.length === 1 ? 'grid-cols-1' : 
                    row.columns.length === 2 ? 'md:grid-cols-2' : 
                    row.columns.length === 3 ? 'md:grid-cols-3' : 
                    'md:grid-cols-4';
    
    rowHTML += `<div class="grid ${gridCols} gap-6">`;
    rowHTML += row.columns.map((column: any) => generateColumnHTML(column)).join('\n');
    rowHTML += '</div>';
  }
  
  rowHTML += '</div>';
  return rowHTML;
}

function generateColumnHTML(column: any): string {
  const columnStyles = column.styles ? generateElementStyles(column.styles) : '';
  let columnHTML = `<div class="column" style="${columnStyles}">`;
  
  if (column.elements && column.elements.length > 0) {
    columnHTML += column.elements.map((element: any) => generateElementHTML(element)).join('\n');
  }
  
  columnHTML += '</div>';
  return columnHTML;
}

function generateElementHTML(element: any): string {
  switch (element.type) {
    case 'heading':
      return generateHeadingHTML(element);
    case 'paragraph':
      return generateParagraphHTML(element);
    case 'image':
      return generateImageHTML(element);
    case 'button':
      return generateButtonHTML(element);
    case 'products_grid':
      return generateProductsGridHTML(element);
    case 'hero':
      return generateHeroHTML(element);
    case 'features':
      return generateFeaturesHTML(element);
    case 'contact_form':
      return generateContactFormHTML(element);
    default:
      return `<div class="element-${element.type}">${element.content?.text || element.content?.title || ''}</div>`;
  }
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

function generateProductsGridHTML(element: any): string {
  const title = element.content?.title || 'Products';
  // In static HTML, we'd need to pre-populate products or make an API call
  // For now, we'll show a placeholder structure
  
  return `
    <section class="py-16 px-responsive">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-4xl font-bold text-center mb-12">${title}</h2>
        <div class="product-grid" id="products-container">
          <!-- Products will be loaded dynamically -->
          <div class="product-card animate-fade-in">
            <img src="/placeholder.svg" alt="Product" class="product-image">
            <div class="product-info">
              <h3 class="product-title">Sample Product</h3>
              <p class="product-price">$99.99</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function generateContactFormHTML(element: any): string {
  const title = element.content?.title || 'Contact Us';
  const subtitle = element.content?.text || 'Get in touch with us';
  
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