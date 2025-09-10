// Storefront-only element registry with minimal editor dependencies
import { ElementType } from '@/components/page-builder/types';

class StorefrontElementRegistryClass {
  private elements: Map<string, ElementType> = new Map();

  register(element: ElementType) {
    this.elements.set(element.id, element);
  }

  get(id: string): ElementType | undefined {
    return this.elements.get(id);
  }

  getAll(): ElementType[] {
    return Array.from(this.elements.values());
  }
}

// Create storefront-specific registry
export const storefrontElementRegistry = new StorefrontElementRegistryClass();

// Register only essential elements for storefront rendering
// This reduces bundle size by excluding editor-heavy components

// Import registry functions
import { registerBasicElements } from '@/components/page-builder/elements/BasicElements';
import { registerContentElements } from '@/components/page-builder/elements/ContentElements';
import { registerMediaElements } from '@/components/page-builder/elements/MediaElements';
import { registerEcommerceElements } from '@/components/page-builder/elements/EcommerceElements';

// Register essential elements without heavy editor dependencies
const registerStorefrontElements = () => {
  // Register elements using the existing registration functions
  registerBasicElements();
  registerContentElements();
  registerMediaElements();
  registerEcommerceElements();
  
  // Copy registered elements to storefront registry
  import('@/components/page-builder/elements').then(({ elementRegistry }) => {
    elementRegistry.getAll().forEach(element => {
      storefrontElementRegistry.register(element);
    });
  });
};

// Initialize registry with minimal elements for storefront
let isInitialized = false;

const initializeStorefrontRegistry = async () => {
  if (isInitialized) return;
  
  try {
    // Only import the full registry if we need it
    const { elementRegistry } = await import('@/components/page-builder/elements');
    
    // Register only essential elements for storefront
    const essentialTypes = [
      'text', 'heading', 'image', 'video', 'button', 'spacer', 'divider',
      'product-grid', 'featured-products', 'collection-grid', 
      'hero-slider', 'testimonials', 'faq', 'newsletter'
    ];
    
    elementRegistry.getAll()
      .filter(element => essentialTypes.includes(element.id))
      .forEach(element => {
        storefrontElementRegistry.register(element);
      });
    
    isInitialized = true;
  } catch (error) {
    console.warn('Failed to initialize storefront registry:', error);
  }
};

// Initialize on first access
export const getStorefrontRegistry = () => {
  if (!isInitialized) {
    initializeStorefrontRegistry();
  }
  return storefrontElementRegistry;
};