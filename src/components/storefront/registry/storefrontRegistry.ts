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

  // Element to category mapping for targeted loading
  private elementCategoryMap: Record<string, string> = {
    // Basic elements (pre-loaded)
    'heading': 'basic',
    'text': 'basic',
    'button': 'basic',
    'spacer': 'basic',
    
    // Media elements (pre-loaded)
    'image': 'media',
    'video': 'media',
    'gallery': 'media',
    'image-gallery': 'media',
    'image-carousel': 'media',
    'video-playlist': 'media',
    
    // Content elements
    'image-feature': 'content',
    'tabs': 'content',
    'accordion': 'content',
    'testimonial': 'content',
    'faq': 'content',
    
    // Marketing elements
    'countdown-timer': 'marketing',
    'countdown': 'marketing', // alias
    'social-links': 'marketing',
    'social-share': 'marketing',
    'hero-slider': 'marketing',
    'newsletter': 'marketing',
    
    // Ecommerce elements
    'product-grid': 'ecommerce',
    'product-card': 'ecommerce',
    'product-carousel': 'ecommerce',
    
    // System elements
    'featured-products': 'system',
    'product-categories': 'system',
    'price': 'system',
    'checkout-full': 'checkout',
    'order-confirmation': 'system',
    
    // Weekly featured
    'weekly-featured': 'featured',
    
    // Form elements
    'contact-form': 'form',
    'subscription-form': 'form',
  };

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
        console.log(`[StorefrontRegistry] Loaded category: ${category}`, module);
        
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
        
        console.log(`[StorefrontRegistry] Registered ${newElements.length} new elements:`, newElements);
        
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
    const category = this.elementCategoryMap[elementId];
    if (!category) {
      console.warn(`Unknown element type: ${elementId}`);
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
    usedElements.forEach(elementId => {
      const category = this.elementCategoryMap[elementId];
      if (category) categorySet.add(category);
    });

    // Load categories in parallel
    const loadPromises = Array.from(categorySet).map(category => 
      this.loadCategory(category)
    );

    try {
      await Promise.all(loadPromises);
    } catch (error) {
      console.warn('Some elements failed to load:', error);
    }
  }

  register(element: StorefrontElementType) {
    console.log(`[StorefrontRegistry] Registering element: ${element.id} (category: ${element.category})`);
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