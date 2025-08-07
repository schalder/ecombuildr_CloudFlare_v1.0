// Initialize all element categories
import { registerBasicElements } from './BasicElements';
import { registerEcommerceElements } from './EcommerceElements';
import { registerFormElements } from './FormElements';
import { registerContentElements } from './ContentElements';
import { registerMediaElements } from './MediaElements';
import { registerAdvancedElements } from './AdvancedElements';
import { registerNavigationElements } from './NavigationElements';

// Register all elements when module loads
registerBasicElements();
registerEcommerceElements();
registerFormElements();
registerContentElements();
registerMediaElements();
registerAdvancedElements();
registerNavigationElements();

// Export the registry
export { elementRegistry } from './ElementRegistry';