import { useParams, useLocation } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';

const isCustomDomain = () => {
  const currentHost = window.location.hostname;
  return !(
    currentHost === 'ecombuildr.com' ||  // Main app domain
    currentHost === 'ecombuildr.pages.dev' ||  // Cloudflare Pages system domain
    currentHost === 'localhost' || 
    currentHost === '127.0.0.1'
  );
};

export const useEcomPaths = () => {
  const params = useParams();
  const location = useLocation();
  const { store } = useStore();
  const slug = store?.slug;
  
  // Get websiteId, websiteSlug, and funnelId from params, or parse from current pathname if params are empty
  let websiteId = (params as any).websiteId as string | undefined;
  let websiteSlug = (params as any).websiteSlug as string | undefined;
  let funnelId = (params as any).funnelId as string | undefined;
  
  // Parse storeId for course routes
  let storeId = (params as any).storeId as string | undefined;

  // If params are empty (e.g., when AddToCartProvider is mounted higher in tree), 
  // parse from current pathname
  if (!websiteId && !websiteSlug && !funnelId && !storeId) {
    const pathname = location.pathname;
    if (pathname.includes('/website/')) {
      websiteId = pathname.split('/website/')[1]?.split('/')[0];
    } else if (pathname.includes('/site/')) {
      websiteSlug = pathname.split('/site/')[1]?.split('/')[0];
    } else if (pathname.includes('/funnel/')) {
      funnelId = pathname.split('/funnel/')[1]?.split('/')[0];
    } else if (pathname.includes('/course/') && !pathname.includes('/courses')) {
      storeId = pathname.split('/course/')[1]?.split('/')[0];
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

  // Handle course routes
  if (storeId) {
    return {
      base: `/course/${storeId}`,
      home: `/course/${storeId}`,
      products: `/course/${storeId}/products`,
      productDetail: (productSlug: string) => `/course/${storeId}/products/${productSlug}`,
      collections: `/course/${storeId}/collections`,
      collectionDetail: (collectionSlug: string) => `/course/${storeId}/collections/${collectionSlug}`,
      checkout: `/course/${storeId}/checkout`,
      cart: `/course/${storeId}/cart`,
      paymentProcessing: (orderId: string) => `/course/${storeId}/payment-processing?orderId=${orderId}`,
      orderConfirmation: (orderId: string, token?: string) => 
        `/course/${storeId}/order-confirmation?orderId=${orderId}${token ? `&ot=${token}` : ''}`,
    };
  }

  // Handle legacy /courses routes
  if (location.pathname.startsWith('/courses')) {
    return {
      base: '/courses',
      home: '/courses',
      products: '/courses/products',
      productDetail: (productSlug: string) => `/courses/products/${productSlug}`,
      collections: '/courses/collections',
      collectionDetail: (collectionSlug: string) => `/courses/collections/${collectionSlug}`,
      checkout: '/courses/checkout',
      cart: '/courses/cart',
      paymentProcessing: (orderId: string) => `/courses/payment-processing?orderId=${orderId}`,
      orderConfirmation: (orderId: string, token?: string) => 
        `/courses/order-confirmation?orderId=${orderId}${token ? `&ot=${token}` : ''}`,
    };
  }

  const base = funnelId
    ? `/funnel/${funnelId}`
    : websiteSlug
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
