// Initialize all element categories
import { registerBasicElements } from './BasicElements';
import { registerEcommerceElements } from './EcommerceElements';
import { registerFormElements } from './FormElements';
import { registerContentElements } from './ContentElements';
import { registerMediaElements } from './MediaElements';
import { registerAdvancedElements } from './AdvancedElements';
import { registerNavigationElements } from './NavigationElements';
import { registerEcommerceSystemElements } from './EcommerceSystemElements';
import { registerInlineCheckoutElements } from './InlineCheckoutElement';
import { registerMarketingElements } from './MarketingElements';
import { registerWeeklyFeaturedElement } from './WeeklyFeaturedElement';
import { elementRegistry } from './ElementRegistry';
 
 // Register all elements when module loads
 registerBasicElements();
 registerEcommerceElements();
 registerEcommerceSystemElements();
 registerInlineCheckoutElements();
 registerFormElements();
 registerContentElements();
 registerMediaElements();
 registerAdvancedElements();
 registerNavigationElements();
 registerMarketingElements();
 registerWeeklyFeaturedElement();
 
 // Export the registry
 export { elementRegistry };