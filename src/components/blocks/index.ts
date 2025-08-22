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
import { productGridBlock } from './theme/ProductGridBlock';
import { categoryCirclesBlock } from './theme/CategoryCirclesBlock';
import { flashSaleBlock } from './theme/FlashSaleBlock';

import { modernEcommerceHeroBlock } from './theme/ModernEcommerceHeroBlock';
import { modernProductGridBlock } from './theme/ModernProductGridBlock';
import { freshOrganicHeroBlock } from './theme/FreshOrganicHeroBlock';

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
blockRegistry.register(productGridBlock);
blockRegistry.register(categoryCirclesBlock);
blockRegistry.register(flashSaleBlock);

blockRegistry.register(modernEcommerceHeroBlock);
blockRegistry.register(modernProductGridBlock);
blockRegistry.register(freshOrganicHeroBlock);

// Export everything
export * from './types';
export * from './registry';
export * from './BlockEditor';
export * from './BlockRenderer';