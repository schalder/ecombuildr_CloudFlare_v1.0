/**
 * Determines if the header and footer should be hidden for system/ecommerce pages
 */
export const shouldHideChrome = (pathname: string): boolean => {
  const systemPaths = [
    '/cart',
    '/checkout', 
    '/payment-processing',
    '/order-confirmation'
  ];
  
  return systemPaths.some(path => 
    pathname === path || 
    pathname.endsWith(path) ||
    pathname.includes(`${path}/`) ||
    pathname.includes(`${path}?`)
  );
};