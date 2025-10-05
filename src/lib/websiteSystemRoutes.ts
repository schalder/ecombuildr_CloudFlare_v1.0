/**
 * Website System Routes - Routes that are reserved for website functionality
 * These routes are hard-coded in DomainWebsiteRouter and should not be used by funnels
 * to prevent routing conflicts when the same domain is connected to both website and funnel
 */

export const WEBSITE_SYSTEM_ROUTES = [
  'products',
  'cart', 
  'checkout',
  'order-confirmation',
  'payment-processing',
  'search',
  'courses'
] as const;

export type WebsiteSystemRoute = typeof WEBSITE_SYSTEM_ROUTES[number];

/**
 * Check if a slug conflicts with website system routes
 * @param slug - The slug to check
 * @returns true if the slug is a website system route
 */
export function isWebsiteSystemRoute(slug: string): boolean {
  return WEBSITE_SYSTEM_ROUTES.includes(slug as WebsiteSystemRoute);
}

/**
 * Get all website system routes as an array
 * @returns Array of all website system routes
 */
export function getWebsiteSystemRoutes(): readonly string[] {
  return WEBSITE_SYSTEM_ROUTES;
}
