import { GutenbergBlockRegistration, GutenbergBlockType } from '../types';

class GutenbergBlockRegistry {
  private blocks: Map<string, GutenbergBlockRegistration> = new Map();
  private categories: Map<string, { title: string; icon: React.ComponentType<{ className?: string }> }> = new Map();

  constructor() {
    // Register default categories
    this.registerCategory('text', { title: 'Text', icon: () => null });
    this.registerCategory('media', { title: 'Media', icon: () => null });
    this.registerCategory('design', { title: 'Design', icon: () => null });
    this.registerCategory('widgets', { title: 'Widgets', icon: () => null });
    this.registerCategory('theme', { title: 'Theme', icon: () => null });
    this.registerCategory('commerce', { title: 'Commerce', icon: () => null });
  }

  registerCategory(slug: string, category: { title: string; icon: React.ComponentType<{ className?: string }> }) {
    this.categories.set(slug, category);
  }

  register(block: GutenbergBlockRegistration) {
    this.blocks.set(block.name, block);
  }

  unregister(name: string) {
    this.blocks.delete(name);
  }

  get(name: string): GutenbergBlockRegistration | undefined {
    return this.blocks.get(name);
  }

  getAll(): GutenbergBlockRegistration[] {
    return Array.from(this.blocks.values());
  }

  getByCategory(category: string): GutenbergBlockRegistration[] {
    return this.getAll().filter(block => block.settings.category === category);
  }

  getCategories() {
    return Array.from(this.categories.entries()).map(([slug, category]) => ({
      slug,
      ...category
    }));
  }

  search(searchTerm: string): GutenbergBlockRegistration[] {
    if (!searchTerm.trim()) return this.getAll();

    const term = searchTerm.toLowerCase();
    return this.getAll().filter(block => {
      const { title, description, keywords = [] } = block.settings;
      
      return (
        title.toLowerCase().includes(term) ||
        description?.toLowerCase().includes(term) ||
        keywords.some(keyword => keyword.toLowerCase().includes(term)) ||
        block.name.toLowerCase().includes(term)
      );
    });
  }

  getInserterItems(searchTerm?: string, category?: string) {
    let blocks = this.getAll();

    // Filter by category
    if (category && category !== 'all') {
      blocks = blocks.filter(block => block.settings.category === category);
    }

    // Filter by search term
    if (searchTerm?.trim()) {
      blocks = this.search(searchTerm);
    }

    // Filter blocks that support inserter
    blocks = blocks.filter(block => block.settings.supports?.inserter !== false);

    // Convert to inserter items format
    return blocks.map(block => ({
      id: block.name,
      name: block.name,
      title: block.settings.title,
      icon: block.settings.icon,
      category: block.settings.category,
      description: block.settings.description,
      keywords: block.settings.keywords || [],
      variations: block.variations,
      frequencyRank: 0, // TODO: Implement usage frequency tracking
      hasChildBlocksWithInserterSupport: false // TODO: Implement child block support
    }));
  }

  // Get block variations
  getVariations(blockName: string) {
    const block = this.get(blockName);
    return block?.variations || [];
  }

  // Get block transforms
  getTransforms() {
    const transforms = {
      from: new Map<string, any[]>(),
      to: new Map<string, any[]>()
    };

    this.getAll().forEach(block => {
      if (block.transforms?.from) {
        block.transforms.from.forEach(transform => {
          transform.blocks.forEach(targetBlock => {
            if (!transforms.from.has(targetBlock)) {
              transforms.from.set(targetBlock, []);
            }
            transforms.from.get(targetBlock)!.push({
              ...transform,
              blockName: block.name
            });
          });
        });
      }

      if (block.transforms?.to) {
        block.transforms.to.forEach(transform => {
          transform.blocks.forEach(targetBlock => {
            if (!transforms.to.has(block.name)) {
              transforms.to.set(block.name, []);
            }
            transforms.to.get(block.name)!.push({
              ...transform,
              blockName: targetBlock
            });
          });
        });
      }
    });

    return transforms;
  }

  // Check if block type exists
  hasBlock(name: string): boolean {
    return this.blocks.has(name);
  }

  // Get block supports
  getBlockSupports(name: string) {
    const block = this.get(name);
    return block?.settings.supports || {};
  }

  // Check if block supports a specific feature
  blockSupports(name: string, feature: keyof NonNullable<GutenbergBlockType['supports']>): boolean {
    const supports = this.getBlockSupports(name);
    return supports[feature] === true;
  }

  // Get blocks that can be used as parent for a specific block
  getParentBlocks(blockName: string): string[] {
    const block = this.get(blockName);
    return block?.settings.parent || [];
  }

  // Get blocks that can be children of a specific block
  getChildBlocks(parentBlockName: string): GutenbergBlockRegistration[] {
    return this.getAll().filter(block => 
      block.settings.parent?.includes(parentBlockName)
    );
  }

  // Check if a block can be inserted as child of another block
  canInsertBlockAsChild(parentBlockName: string, childBlockName: string): boolean {
    const childBlock = this.get(childBlockName);
    if (!childBlock?.settings.parent) return true; // No parent restrictions
    
    return childBlock.settings.parent.includes(parentBlockName);
  }
}

export const gutenbergRegistry = new GutenbergBlockRegistry();