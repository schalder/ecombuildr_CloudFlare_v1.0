import { ElementType, PageBuilderElement } from '../types';

class ElementRegistryClass {
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

  getByCategory(category: ElementType['category']): ElementType[] {
    return this.getAll().filter(element => element.category === category);
  }

  // Create element with default styles applied
  createElement(elementType: string, id: string): PageBuilderElement | null {
    const type = this.get(elementType);
    if (!type) return null;

    return {
      id,
      type: elementType,
      content: { ...type.defaultContent },
      styles: type.defaultStyles ? { ...type.defaultStyles } : undefined
    };
  }
}

export const elementRegistry = new ElementRegistryClass();