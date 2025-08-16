/**
 * Utility to determine if system chrome (header/footer) should be hidden on system pages
 * System pages like cart, checkout, payment processing should be clean without headers/footers
 */

const SYSTEM_PAGE_PATHS = [
  '/cart',
  '/checkout', 
  '/payment-processing',
  '/order-confirmation'
];

/**
 * Determines if headers and footers should be hidden based on the current pathname
 * @param pathname - The current pathname from useLocation()
 * @returns boolean - true if chrome should be hidden
 */
export const shouldHideChrome = (pathname: string): boolean => {
  return SYSTEM_PAGE_PATHS.some(systemPath => pathname === systemPath);
};