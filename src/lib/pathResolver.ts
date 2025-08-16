import { useParams } from 'react-router-dom';
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
  const websiteId = (params as any).websiteId as string | undefined;
  const websiteSlug = (params as any).websiteSlug as string | undefined;
  const { store } = useStore();
  const slug = store?.slug;

  // If we're on a custom domain, use clean paths
  if (isCustomDomain()) {
    return {
      base: '',
      home: '/',
      products: '/products',
      productDetail: (productSlug: string) => `/products/${productSlug}`,
      checkout: '/checkout',
      cart: '/cart',
      paymentProcessing: (orderId: string) => `/payment-processing?orderId=${orderId}`,
      orderConfirmation: (orderId: string) => `/order-confirmation?orderId=${orderId}`,
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
    checkout: `${base}/checkout`,
    cart: `${base}/cart`,
    paymentProcessing: (orderId: string) => websiteId || websiteSlug ? `${base}/payment-processing?orderId=${orderId}` : `${base}/payment-processing/${orderId}`,
    orderConfirmation: (orderId: string) => websiteId || websiteSlug ? `${base}/order-confirmation?orderId=${orderId}` : `${base}/order-confirmation/${orderId}`,
  };
};
