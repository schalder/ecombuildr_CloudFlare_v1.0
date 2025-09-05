import { useParams, useLocation } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';

const isCustomDomain = () => {
  const currentHost = window.location.hostname;
  return !(
    currentHost === 'ecombuildr.com' || 
    currentHost === 'localhost' || 
    currentHost.includes('lovable.app') ||
    currentHost.includes('lovableproject.com')
  );
};

export const useEcomPaths = () => {
  const params = useParams();
  const location = useLocation();
  const { store } = useStore();
  const slug = store?.slug;
  
  // Get websiteId and websiteSlug from params, or parse from current pathname if params are empty
  let websiteId = (params as any).websiteId as string | undefined;
  let websiteSlug = (params as any).websiteSlug as string | undefined;
  
  // If params are empty (e.g., when AddToCartProvider is mounted higher in tree), 
  // parse from current pathname
  if (!websiteId && !websiteSlug) {
    const pathname = location.pathname;
    if (pathname.includes('/website/')) {
      websiteId = pathname.split('/website/')[1]?.split('/')[0];
    } else if (pathname.includes('/site/')) {
      websiteSlug = pathname.split('/site/')[1]?.split('/')[0];
    }
  }

  // If we're on a custom domain, use clean paths
  if (isCustomDomain()) {
    return {
      base: '',
      home: '/',
      products: '/products',
      productDetail: (productSlug: string) => `/products/${productSlug}`,
      collections: '/collections',
      collectionDetail: (collectionSlug: string) => `/collections/${collectionSlug}`,
      checkout: '/checkout',
      cart: '/cart',
      paymentProcessing: (orderId: string) => `/payment-processing?orderId=${orderId}`,
      orderConfirmation: (orderId: string, token?: string) => 
        `/order-confirmation?orderId=${orderId}${token ? `&ot=${token}` : ''}`,
    };
  }

  const base = websiteSlug
    ? `/site/${websiteSlug}`
    : websiteId
    ? `/website/${websiteId}`
    : slug
    ? `/store/${slug}`
    : '/';

  return {
    base,
    home: base,
    products: `${base}/products`,
    productDetail: (productSlug: string) => `${base}/products/${productSlug}`,
    collections: `${base}/collections`,
    collectionDetail: (collectionSlug: string) => `${base}/collections/${collectionSlug}`,
    checkout: `${base}/checkout`,
    cart: `${base}/cart`,
    paymentProcessing: (orderId: string) => websiteId || websiteSlug ? `${base}/payment-processing?orderId=${orderId}` : `${base}/payment-processing/${orderId}`,
    orderConfirmation: (orderId: string, token?: string) => {
      const tokenParam = token ? `&ot=${token}` : '';
      return websiteId || websiteSlug 
        ? `${base}/order-confirmation?orderId=${orderId}${tokenParam}` 
        : `${base}/order-confirmation/${orderId}${tokenParam ? `?${tokenParam.slice(1)}` : ''}`;
    },
  };
};
