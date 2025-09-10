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

// Auto-register on import
registerStorefrontElements();