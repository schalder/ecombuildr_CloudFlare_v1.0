import React from 'react';
import { gutenbergRegistry } from './registry/GutenbergRegistry';

// Import core blocks
import { paragraphBlock } from './blocks/core/ParagraphBlock';
import { headingBlock } from './blocks/core/HeadingBlock';
import { imageBlock } from './blocks/core/ImageBlock';

// Import commerce blocks
import { productGridBlock } from './blocks/commerce/ProductGridBlock';

// Register all blocks
gutenbergRegistry.register(paragraphBlock);
gutenbergRegistry.register(headingBlock);
gutenbergRegistry.register(imageBlock);
gutenbergRegistry.register(productGridBlock);

// Export main components
export { GutenbergEditor } from './GutenbergEditor';
export { gutenbergRegistry };
export * from './types';
export * from './hooks/useEditorState';