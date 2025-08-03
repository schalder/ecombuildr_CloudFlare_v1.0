// Initialize all element categories
import { registerBasicElements } from './BasicElements';
import { registerEcommerceElements } from './EcommerceElements';

// Register all elements when module loads
registerBasicElements();
registerEcommerceElements();

// Export the registry
export { elementRegistry } from './ElementRegistry';