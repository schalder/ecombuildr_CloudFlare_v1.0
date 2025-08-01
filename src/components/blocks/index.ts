// Register all core blocks
import { blockRegistry } from './registry';
import { paragraphBlock } from './core/ParagraphBlock';
import { headingBlock } from './core/HeadingBlock';
import { imageBlock } from './core/ImageBlock';

// Register core blocks
blockRegistry.register(paragraphBlock);
blockRegistry.register(headingBlock);
blockRegistry.register(imageBlock);

// Export everything
export * from './types';
export * from './registry';
export * from './BlockEditor';
export * from './BlockRenderer';