// Server-side page routing logic for Edge Function
// Maps URLs to database queries and page data

export interface PageRoute {
  path: string;
  type: 'homepage' | 'page' | 'product' | 'collection' | 'cart' | 'checkout' | 'system';
  slug?: string;
  query: string;
  params: string[];
}

export interface PageData {
  id: string;
  title: string;
  slug: string;
  content: any;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  social_image_url?: string;
  og_image?: string;
  preview_image_url?: string;
  is_published: boolean;
  is_homepage?: boolean;
}

export interface WebsiteData {
  id: string;
  name: string;
  slug: string;
  settings: any;
  is_active: boolean;
  is_published: boolean;
}

export interface ProductData {
  id: string;
  title: string;
  slug: string;
  description?: string;
  price?: number;
  images?: string[];
  seo_title?: string;
  seo_description?: string;
  social_image_url?: string;
  is_published: boolean;
}

// Define page routes
export const PAGE_ROUTES: PageRoute[] = [
  {
    path: '/',
    type: 'homepage',
    query: 'SELECT * FROM website_pages WHERE website_id = $1 AND is_homepage = true AND is_published = true',
    params: ['website_id']
  },
  {
    path: '/products',
    type: 'page',
    slug: 'products',
    query: 'SELECT * FROM website_pages WHERE website_id = $1 AND slug = $2 AND is_published = true',
    params: ['website_id', 'slug']
  },
  {
    path: '/cart',
    type: 'page',
    slug: 'cart',
    query: 'SELECT * FROM website_pages WHERE website_id = $1 AND slug = $2 AND is_published = true',
    params: ['website_id', 'slug']
  },
  {
    path: '/checkout',
    type: 'page',
    slug: 'checkout',
    query: 'SELECT * FROM website_pages WHERE website_id = $1 AND slug = $2 AND is_published = true',
    params: ['website_id', 'slug']
  },
  {
    path: '/about',
    type: 'page',
    slug: 'about',
    query: 'SELECT * FROM website_pages WHERE website_id = $1 AND slug = $2 AND is_published = true',
    params: ['website_id', 'slug']
  },
  {
    path: '/contact',
    type: 'page',
    slug: 'contact',
    query: 'SELECT * FROM website_pages WHERE website_id = $1 AND slug = $2 AND is_published = true',
    params: ['website_id', 'slug']
  },
  {
    path: '/privacy',
    type: 'page',
    slug: 'privacy',
    query: 'SELECT * FROM website_pages WHERE website_id = $1 AND slug = $2 AND is_published = true',
    params: ['website_id', 'slug']
  },
  {
    path: '/terms',
    type: 'page',
    slug: 'terms',
    query: 'SELECT * FROM website_pages WHERE website_id = $1 AND slug = $2 AND is_published = true',
    params: ['website_id', 'slug']
  }
];

// Parse URL path and determine route type
export function parsePath(pathname: string): { type: string; slug?: string; productSlug?: string } {
  // Remove trailing slash
  const path = pathname.replace(/\/$/, '') || '/';
  
  // Check for exact matches first
  const exactRoute = PAGE_ROUTES.find(route => route.path === path);
  if (exactRoute) {
    return {
      type: exactRoute.type,
      slug: exactRoute.slug
    };
  }
  
  // Check for product detail pages
  if (path.startsWith('/products/')) {
    const productSlug = path.split('/')[2];
    return {
      type: 'product',
      productSlug
    };
  }
  
  // Check for collection pages
  if (path.startsWith('/collections/')) {
    const collectionSlug = path.split('/')[2];
    return {
      type: 'collection',
      slug: collectionSlug
    };
  }
  
  // Check for custom pages (fallback to page type)
  const customSlug = path.substring(1); // Remove leading slash
  return {
    type: 'page',
    slug: customSlug
  };
}

// Get page data based on route
export async function getPageData(
  supabase: any,
  websiteId: string,
  pathname: string
): Promise<{ page: PageData | null; type: string; product?: ProductData }> {
  const { type, slug, productSlug } = parsePath(pathname);
  
  try {
    if (type === 'homepage') {
      const { data: page, error } = await supabase
        .from('website_pages')
        .select('*')
        .eq('website_id', websiteId)
        .eq('is_homepage', true)
        .eq('is_published', true)
        .maybeSingle();
      
      if (error) throw error;
      return { page, type };
    }
    
    if (type === 'product' && productSlug) {
      // Get website to get store_id
      const { data: website, error: websiteError } = await supabase
        .from('websites')
        .select('store_id')
        .eq('id', websiteId)
        .single();
      
      if (websiteError) throw websiteError;
      
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', website.store_id)
        .eq('slug', productSlug)
        .eq('is_published', true)
        .maybeSingle();
      
      if (productError) throw productError;
      
      // Convert product to page-like structure
      const page: PageData = {
        id: product.id,
        title: product.title,
        slug: product.slug,
        content: {
          sections: [
            {
              id: 'product-section',
              width: 'medium',
              rows: [
                {
                  id: 'product-row',
                  columns: [
                    {
                      id: 'product-column',
                      width: 12,
                      elements: [
                        {
                          id: 'product-title',
                          type: 'heading',
                          content: { text: product.title, level: 'h1' }
                        },
                        {
                          id: 'product-description',
                          type: 'text',
                          content: { text: product.description || '' }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        seo_title: product.seo_title || product.title,
        seo_description: product.seo_description || product.description,
        social_image_url: product.social_image_url,
        is_published: product.is_published,
        is_homepage: false
      };
      
      return { page, type, product };
    }
    
    if (type === 'page' && slug) {
      const { data: page, error } = await supabase
        .from('website_pages')
        .select('*')
        .eq('website_id', websiteId)
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      
      if (error) throw error;
      return { page, type };
    }
    
    // Fallback: try to find any page with this slug
    if (slug) {
      const { data: page, error } = await supabase
        .from('website_pages')
        .select('*')
        .eq('website_id', websiteId)
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      
      if (error) throw error;
      return { page, type };
    }
    
    return { page: null, type };
    
  } catch (error) {
    console.error('Error fetching page data:', error);
    return { page: null, type };
  }
}

// Get website data
export async function getWebsiteData(
  supabase: any,
  websiteId: string
): Promise<WebsiteData | null> {
  try {
    const { data: website, error } = await supabase
      .from('websites')
      .select('*')
      .eq('id', websiteId)
      .eq('is_active', true)
      .eq('is_published', true)
      .maybeSingle();
    
    if (error) throw error;
    return website;
  } catch (error) {
    console.error('Error fetching website data:', error);
    return null;
  }
}

// Generate fallback page content
export function generateFallbackPage(type: string, slug?: string): PageData {
  const titles: { [key: string]: string } = {
    'homepage': 'Welcome',
    'products': 'Our Products',
    'cart': 'Shopping Cart',
    'checkout': 'Checkout',
    'about': 'About Us',
    'contact': 'Contact Us',
    'privacy': 'Privacy Policy',
    'terms': 'Terms of Service',
    'page': slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Page'
  };
  
  const descriptions: { [key: string]: string } = {
    'homepage': 'Welcome to our website',
    'products': 'Browse our amazing products',
    'cart': 'Review your cart items',
    'checkout': 'Complete your purchase',
    'about': 'Learn more about us',
    'contact': 'Get in touch with us',
    'privacy': 'Our privacy policy',
    'terms': 'Terms of service',
    'page': `Welcome to our ${slug || 'page'}`
  };
  
  return {
    id: `fallback-${type}`,
    title: titles[type] || 'Page',
    slug: slug || type,
    content: {
      sections: [
        {
          id: 'fallback-section',
          width: 'medium',
          rows: [
            {
              id: 'fallback-row',
              columns: [
                {
                  id: 'fallback-column',
                  width: 12,
                  elements: [
                    {
                      id: 'fallback-title',
                      type: 'heading',
                      content: { text: titles[type] || 'Page', level: 'h1' }
                    },
                    {
                      id: 'fallback-description',
                      type: 'text',
                      content: { text: descriptions[type] || 'This page is coming soon.' }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    seo_title: titles[type] || 'Page',
    seo_description: descriptions[type] || 'This page is coming soon.',
    is_published: true,
    is_homepage: type === 'homepage'
  };
}
