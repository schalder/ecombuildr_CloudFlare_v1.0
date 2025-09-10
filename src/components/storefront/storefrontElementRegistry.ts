import { ElementType } from '@/components/page-builder/types';

class StorefrontElementRegistryClass {
  private elements: Map<string, ElementType> = new Map();
  private loadedCategories: Set<string> = new Set();

  register(element: ElementType) {
    this.elements.set(element.id, element);
  }

  get(id: string): ElementType | undefined {
    // First try to get the element
    let elementType = this.elements.get(id);
    
    if (!elementType) {
      // Try backward-compatible fallbacks
      const normalized = id.replace(/_/g, '-');
      const aliasMap: Record<string, string> = {
        'product_grid': 'product-grid',
        'featured_products': 'featured-products',
        'product_categories': 'product-categories',
        'category_navigation': 'product-categories',
      };
      
      const candidates = Array.from(
        new Set([
          normalized,
          aliasMap[id],
          aliasMap[normalized],
        ].filter(Boolean) as string[])
      );
      
      for (const candidate of candidates) {
        const hit = this.elements.get(candidate);
        if (hit) {
          elementType = hit;
          break;
        }
      }
    }

    // If still not found, try to lazy load based on element type
    if (!elementType) {
      this.lazyLoadElement(id);
      elementType = this.elements.get(id);
    }

    return elementType;
  }

  getAll(): ElementType[] {
    return Array.from(this.elements.values());
  }

  getByCategory(category: ElementType['category']): ElementType[] {
    // Ensure category is loaded
    this.lazyLoadCategory(category);
    return this.getAll().filter(element => element.category === category);
  }

  private lazyLoadElement(id: string) {
    // Map element IDs to their respective modules
    const elementModuleMap: Record<string, () => Promise<any>> = {
      // Basic elements
      'heading': () => import('@/components/page-builder/elements/BasicElements').then(m => m.registerBasicElements()),
      'text': () => import('@/components/page-builder/elements/BasicElements').then(m => m.registerBasicElements()),
      'button': () => import('@/components/page-builder/elements/BasicElements').then(m => m.registerBasicElements()),
      'divider': () => import('@/components/page-builder/elements/BasicElements').then(m => m.registerBasicElements()),
      'spacer': () => import('@/components/page-builder/elements/BasicElements').then(m => m.registerBasicElements()),
      
      // Media elements
      'image': () => import('@/components/page-builder/elements/MediaElements').then(m => m.registerMediaElements()),
      'video': () => import('@/components/page-builder/elements/MediaElements').then(m => m.registerMediaElements()),
      'image-carousel': () => import('@/components/page-builder/elements/MediaElements').then(m => m.registerMediaElements()),
      'image-gallery': () => import('@/components/page-builder/elements/MediaElements').then(m => m.registerMediaElements()),
      'video-playlist': () => import('@/components/page-builder/elements/MediaElements').then(m => m.registerMediaElements()),
      
      // Content elements
      'accordion': () => import('@/components/page-builder/elements/ContentElements').then(m => m.registerContentElements()),
      'list': () => import('@/components/page-builder/elements/ContentElements').then(m => m.registerContentElements()),
      'testimonial': () => import('@/components/page-builder/elements/ContentElements').then(m => m.registerContentElements()),
      'faq': () => import('@/components/page-builder/elements/ContentElements').then(m => m.registerContentElements()),
      
      // Ecommerce elements
      'product-grid': () => import('@/components/page-builder/elements/EcommerceElements').then(m => m.registerEcommerceElements()),
      'featured-products': () => import('@/components/page-builder/elements/EcommerceElements').then(m => m.registerEcommerceElements()),
      'product-categories': () => import('@/components/page-builder/elements/EcommerceElements').then(m => m.registerEcommerceElements()),
      'price': () => import('@/components/page-builder/elements/EcommerceElements').then(m => m.registerEcommerceElements()),
      
      // Form elements
      'form': () => import('@/components/page-builder/elements/FormElements').then(m => m.registerFormElements()),
      'contact-form': () => import('@/components/page-builder/elements/FormElements').then(m => m.registerFormElements()),
      'newsletter': () => import('@/components/page-builder/elements/FormElements').then(m => m.registerFormElements()),
      
      // Advanced elements
      'countdown': () => import('@/components/page-builder/elements/AdvancedElements').then(m => m.registerAdvancedElements()),
      'hero-slider': () => import('@/components/page-builder/elements/AdvancedElements').then(m => m.registerAdvancedElements()),
      'social-share': () => import('@/components/page-builder/elements/AdvancedElements').then(m => m.registerAdvancedElements()),
      'custom-html': () => import('@/components/page-builder/elements/AdvancedElements').then(m => m.registerAdvancedElements()),
      
      // System elements
      'checkout-full': () => import('@/components/page-builder/elements/EcommerceSystemElements').then(m => m.registerEcommerceSystemElements()),
      'order-confirmation': () => import('@/components/page-builder/elements/EcommerceSystemElements').then(m => m.registerEcommerceSystemElements()),
      
      // Marketing elements
      'funnel-offer': () => import('@/components/page-builder/elements/MarketingElements').then(m => m.registerMarketingElements()),
      'weekly-featured': () => import('@/components/page-builder/elements/WeeklyFeaturedElement').then(m => m.registerWeeklyFeaturedElement()),
    };

    const loader = elementModuleMap[id];
    if (loader) {
      loader().catch(err => {
        console.warn(`Failed to lazy load element ${id}:`, err);
      });
    }
  }

  private lazyLoadCategory(category: string) {
    if (this.loadedCategories.has(category)) return;

    const categoryModuleMap: Record<string, () => Promise<any>> = {
      'basic': () => import('@/components/page-builder/elements/BasicElements').then(m => m.registerBasicElements()),
      'media': () => import('@/components/page-builder/elements/MediaElements').then(m => m.registerMediaElements()),
      'content': () => import('@/components/page-builder/elements/ContentElements').then(m => m.registerContentElements()),
      'ecommerce': () => import('@/components/page-builder/elements/EcommerceElements').then(m => m.registerEcommerceElements()),
      'form': () => import('@/components/page-builder/elements/FormElements').then(m => m.registerFormElements()),
      'advanced': () => import('@/components/page-builder/elements/AdvancedElements').then(m => m.registerAdvancedElements()),
      'navigation': () => import('@/components/page-builder/elements/NavigationElements').then(m => m.registerNavigationElements()),
      'marketing': () => import('@/components/page-builder/elements/MarketingElements').then(m => m.registerMarketingElements()),
    };

    const loader = categoryModuleMap[category];
    if (loader) {
      loader().then(() => {
        this.loadedCategories.add(category);
      }).catch(err => {
        console.warn(`Failed to lazy load category ${category}:`, err);
      });
    }
  }
}

export const storefrontElementRegistry = new StorefrontElementRegistryClass();

// Pre-register the most commonly used elements
import('@/components/page-builder/elements/BasicElements').then(m => m.registerBasicElements());
import('@/components/page-builder/elements/MediaElements').then(m => m.registerMediaElements());