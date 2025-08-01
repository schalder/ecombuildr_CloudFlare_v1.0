import { BlockRegistration } from './types';

class BlockRegistry {
  private blocks: Map<string, BlockRegistration> = new Map();

  register(block: BlockRegistration) {
    this.blocks.set(block.name, block);
  }

  get(name: string): BlockRegistration | undefined {
    return this.blocks.get(name);
  }

  getAll(): BlockRegistration[] {
    return Array.from(this.blocks.values());
  }

  getByCategory(category: string): BlockRegistration[] {
    return this.getAll().filter(block => block.settings.category === category);
  }
}

export const blockRegistry = new BlockRegistry();