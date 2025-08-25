import { ElementType } from '../types';

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
}

export const elementRegistry = new ElementRegistryClass();