import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export const useStorefrontRenderer = () => {
  const location = useLocation();
  
  const shouldUseStorefront = useMemo(() => {
    // Check URL parameter first
    const urlParams = new URLSearchParams(location.search);
    const sfParam = urlParams.get('sf');
    
    if (sfParam === '1' || sfParam === 'true') {
      return true;
    }
    
    if (sfParam === '0' || sfParam === 'false') {
      return false;
    }
    
    // Check environment variable default
    const envDefault = process.env.VITE_STOREFRONT_RENDERER_DEFAULT;
    if (envDefault === 'true') {
      return true;
    }
    
    // Check if this is a public storefront page (not admin/builder)
    const isAdminPage = location.pathname.includes('/dashboard') || 
                       location.pathname.includes('/admin') ||
                       location.pathname.includes('/builder') ||
                       location.pathname.includes('/edit');
    
    // Use storefront renderer for public pages by default
    return !isAdminPage;
  }, [location.search, location.pathname]);
  
  return {
    useStorefront: shouldUseStorefront,
    isOptimizedPath: shouldUseStorefront
  };
};