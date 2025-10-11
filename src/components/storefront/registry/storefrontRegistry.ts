// Optimized element registry for storefront pages
// Only loads elements that are actually used on the page

export interface StorefrontElementType {
  id: string;
  name: string;
  category: 'basic' | 'media' | 'ecommerce' | 'marketing' | 'form' | 'custom';
  component: React.ComponentType<any>;
}

class StorefrontElementRegistry {
  private elements: Map<string, StorefrontElementType> = new Map();
  private loadingPromises: Map<string, Promise<void>> = new Map();
  private listeners: Set<() => void> = new Set();

  // Category module mappings for lazy loading
  private categoryModules: Record<string, () => Promise<any>> = {
    basic: () => import('@/components/page-builder/elements/BasicElements'),
    media: () => import('@/components/page-builder/elements/MediaElements'),
    ecommerce: () => import('@/components/page-builder/elements/EcommerceElements'),
    marketing: () => import('@/components/page-builder/elements/MarketingElements'),
    form: () => import('@/components/page-builder/elements/FormElements'),
    content: () => import('@/components/page-builder/elements/ContentElements'),
    advanced: () => import('@/components/page-builder/elements/AdvancedElements'),
    navigation: () => import('@/components/page-builder/elements/NavigationElements'),
    system: () => import('@/components/page-builder/elements/EcommerceSystemElements'),
    checkout: () => import('@/components/page-builder/elements/InlineCheckoutElement'),
    featured: () => import('@/components/page-builder/elements/WeeklyFeaturedElement'),
  };

  // Element to category mapping for targeted loading - CORRECTED AND COMPLETE
  private elementCategoryMap: Record<string, string> = {
    // Basic elements (pre-loaded)
    'heading': 'basic',
    'text': 'basic', 
    'button': 'basic',
    'image': 'basic',  // FIXED: was 'media'
    'video': 'basic',  // FIXED: was 'media'
    'spacer': 'basic',
    'divider': 'basic',
    'list': 'basic',
    
    // Media elements (pre-loaded)
    'image-gallery': 'media',
    'image-carousel': 'media',
    'video-playlist': 'media',
    
    // Content elements
    'image-feature': 'content',
    'accordion': 'content',
    'tabs': 'content',
    'testimonial': 'content',
    'faq': 'content',
    
    // Marketing elements
    'countdown-timer': 'marketing',
    'countdown': 'marketing', // alias
    'social-links': 'marketing',
    'hero-slider': 'marketing',
    
    // Form elements
    'contact-form': 'form',
    'newsletter': 'form',
    'form-field': 'form',
    
    // Ecommerce elements
    'products-page': 'ecommerce',
    'product-grid': 'ecommerce',
    'featured-products': 'ecommerce',  // FIXED: was 'system'
    'product-categories': 'ecommerce', // FIXED: was 'system'
    'weekly-featured': 'ecommerce',    // FIXED: was 'featured'
    'price': 'ecommerce',              // FIXED: was 'system'
    'funnel-offer': 'ecommerce',
    
    // System elements
    'cart-summary': 'system',
    'checkout-cta': 'system',
    'product-detail': 'system',
    'related-products': 'system',
    'cart-full': 'system',
    'checkout-full': 'system',         // FIXED: was 'checkout'
    'order-confirmation': 'system',
    'payment-processing': 'system',
    
    // Checkout elements
    'checkout-inline': 'checkout',
    
    // Advanced elements
    'google-maps': 'advanced',
    'custom-html': 'advanced',
    'social-share': 'advanced',        // FIXED: was 'marketing'
    
    // Navigation elements
    'navigation-menu': 'navigation',
    
    // Legacy/unused elements (kept for compatibility)
    'gallery': 'media',
    'product-card': 'ecommerce',
    'product-carousel': 'ecommerce',
    'subscription-form': 'form',
  };
  
  // Dynamic resolution cache for unknown elements
  private dynamicResolutions: Map<string, string> = new Map();

  // Pre-register critical elements synchronously
  async preloadCriticalElements() {
    try {
      // Load basic and media elements immediately for LCP
      await Promise.all([
        this.loadCategory('basic'),
        this.loadCategory('media')
      ]);
    } catch (error) {
      console.warn('Failed to preload critical elements:', error);
    }
  }

  private async loadCategory(category: string): Promise<void> {
    if (this.loadingPromises.has(category)) {
      return this.loadingPromises.get(category);
    }

    const moduleLoader = this.categoryModules[category];
    if (!moduleLoader) {
      console.warn(`No module found for category: ${category}`);
      return;
    }

    const loadPromise = moduleLoader()
      .then(async (module) => {
        // Get elements before importing
        const elementsBefore = new Set(this.elements.keys());
        
        // Call the register function from the module - these register with main elementRegistry
        if (module.registerBasicElements) module.registerBasicElements();
        if (module.registerMediaElements) module.registerMediaElements();
        if (module.registerEcommerceElements) module.registerEcommerceElements();
        if (module.registerMarketingElements) module.registerMarketingElements();
        if (module.registerFormElements) module.registerFormElements();
        if (module.registerContentElements) module.registerContentElements();
        if (module.registerAdvancedElements) module.registerAdvancedElements();
        if (module.registerNavigationElements) module.registerNavigationElements();
        if (module.registerEcommerceSystemElements) module.registerEcommerceSystemElements();
        if (module.registerInlineCheckoutElements) module.registerInlineCheckoutElements();
        if (module.registerWeeklyFeaturedElement) module.registerWeeklyFeaturedElement();
        
        // Dynamically import and copy elements from the main registry
        const { elementRegistry } = await import('@/components/page-builder/elements/ElementRegistry');
        
        // Copy all elements from the main registry that belong to this category
        for (const element of elementRegistry.getAll()) {
          if (element.category === category || this.elementCategoryMap[element.id] === category) {
            const storefrontElement: StorefrontElementType = {
              id: element.id,
              name: element.name,
              category: element.category,
              component: element.component
            };
            this.elements.set(element.id, storefrontElement);
          }
        }
        
        // Get newly registered elements
        const elementsAfter = new Set(this.elements.keys());
        const newElements = Array.from(elementsAfter).filter(id => !elementsBefore.has(id));
        
        this.notify();
      })
      .catch((error) => {
        console.warn(`Failed to load category ${category}:`, error);
        this.loadingPromises.delete(category);
        throw error;
      });

    this.loadingPromises.set(category, loadPromise);
    return loadPromise;
  }

  async ensureElementLoaded(elementId: string): Promise<void> {
    // Check if element is already registered
    if (this.elements.has(elementId)) {
      return;
    }

    // Find the category for this element
    let category = this.elementCategoryMap[elementId];
    
    // If not in map, check dynamic resolution cache
    if (!category) {
      category = this.dynamicResolutions.get(elementId);
    }
    
    // If still not found, try fallback loading sequence
    if (!category) {
      const fallbackCategories = ['content', 'marketing', 'ecommerce', 'form', 'advanced', 'navigation', 'system', 'checkout'];
      
      for (const fallbackCategory of fallbackCategories) {
        try {
          await this.loadCategory(fallbackCategory);
          
          // Check if element is now available
          if (this.elements.has(elementId)) {
            this.dynamicResolutions.set(elementId, fallbackCategory);
            return;
          }
        } catch (error) {
          // Failed to load fallback category
        }
      }
      
      return;
    }

    // Load the category
    await this.loadCategory(category);
  }

  // Analyze page data and preload required elements
  async preloadPageElements(pageData: any): Promise<void> {
    if (!pageData?.sections) return;

    const usedElements = new Set<string>();
    
    // Extract all element types from page data
    const extractElements = (obj: any) => {
      if (!obj) return;
      
      if (Array.isArray(obj)) {
        obj.forEach(extractElements);
      } else if (typeof obj === 'object') {
        if (obj.type && typeof obj.type === 'string') {
          usedElements.add(obj.type);
        }
        Object.values(obj).forEach(extractElements);
      }
    };

    extractElements(pageData.sections);
    
    // Group elements by category to minimize bundle loads
    const categorySet = new Set<string>();
    const unknownElements: string[] = [];
    
    usedElements.forEach(elementId => {
      const category = this.elementCategoryMap[elementId];
      if (category) {
        categorySet.add(category);
      } else {
        unknownElements.push(elementId);
      }
    });
    
    // Load categories in parallel
    const loadPromises = Array.from(categorySet).map(category => 
      this.loadCategory(category)
    );

    try {
      await Promise.all(loadPromises);
      
      // Check for unresolved elements after initial load
      const unresolvedElements = Array.from(usedElements).filter(id => !this.elements.has(id));
      
      if (unresolvedElements.length > 0) {
        // Fallback: load content and advanced modules as catch-alls
        await Promise.all([
          this.loadCategory('content'),
          this.loadCategory('advanced')
        ]);
        
        // Final check
        const stillUnresolved = Array.from(usedElements).filter(id => !this.elements.has(id));
      }
      
    } catch (error) {
      console.warn('Some elements failed to load:', error);
    }
  }

  // Preload only critical elements that are commonly above-fold
  async preloadCriticalElements(): Promise<void> {
    // Critical elements that are commonly above-fold
    const criticalCategories = ['basic']; // heading, text, button, image
    
    const loadPromises = criticalCategories.map(category => 
      this.loadCategory(category)
    );
    
    try {
      await Promise.all(loadPromises);
    } catch (error) {
      console.warn('Some critical elements failed to load:', error);
    }
  }

  // Load category with priority - high priority loads immediately, low priority defers
  async loadCategoryWithPriority(category: string, priority: 'high' | 'low' = 'low'): Promise<void> {
    // If high priority, load immediately
    if (priority === 'high') {
      return this.loadCategory(category);
    }
    
    // Low priority: defer to idle callback
    return new Promise((resolve) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          this.loadCategory(category).then(resolve).catch((err) => {
            console.warn(`Failed to load ${category}:`, err);
            resolve();
          });
        }, { timeout: 3000 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          this.loadCategory(category).then(resolve).catch((err) => {
            console.warn(`Failed to load ${category}:`, err);
            resolve();
          });
        }, 100);
      }
    });
  }

  register(element: StorefrontElementType) {
    this.elements.set(element.id, element);
    this.notify();
  }

  get(id: string): StorefrontElementType | undefined {
    return this.elements.get(id);
  }

  getAll(): StorefrontElementType[] {
    return Array.from(this.elements.values());
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(callback => callback());
  }
}

export const storefrontRegistry = new StorefrontElementRegistry();

// Initialize critical elements immediately
storefrontRegistry.preloadCriticalElements();