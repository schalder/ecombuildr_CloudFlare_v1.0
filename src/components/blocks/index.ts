// Register all core blocks
import { blockRegistry } from './registry';
import { paragraphBlock } from './core/ParagraphBlock';
import { headingBlock } from './core/HeadingBlock';
import { imageBlock } from './core/ImageBlock';

// Register theme blocks
import { heroTechBlock } from './theme/HeroTechBlock';
import { heroOrganicBlock } from './theme/HeroOrganicBlock';
import { featuredProductsBlock } from './theme/FeaturedProductsBlock';
import { categoryShowcaseBlock } from './theme/CategoryShowcaseBlock';
import { newsletterBlock } from './theme/NewsletterBlock';
import { valuesSectionBlock } from './theme/ValuesSection';
import { promoBannerBlock } from './theme/PromoBannerBlock';
import { testimonialsBlock } from './theme/TestimonialsBlock';

// Register core blocks
blockRegistry.register(paragraphBlock);
blockRegistry.register(headingBlock);
blockRegistry.register(imageBlock);

// Register theme blocks
blockRegistry.register(heroTechBlock);
blockRegistry.register(heroOrganicBlock);
blockRegistry.register(featuredProductsBlock);
blockRegistry.register(categoryShowcaseBlock);
blockRegistry.register(newsletterBlock);
blockRegistry.register(valuesSectionBlock);
blockRegistry.register(promoBannerBlock);
blockRegistry.register(testimonialsBlock);

// Export everything
export * from './types';
export * from './registry';
export * from './BlockEditor';
export * from './BlockRenderer';