import { useParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';

export const useEcomPaths = () => {
  const params = useParams();
  const websiteId = (params as any).websiteId as string | undefined;
  const { store } = useStore();
  const slug = store?.slug;

  const base = websiteId ? `/website/${websiteId}` : (slug ? `/store/${slug}` : '/');

  return {
    base,
    home: base,
    products: `${base}/products`,
    productDetail: (productSlug: string) => `${base}/products/${productSlug}`,
    checkout: `${base}/checkout`,
    cart: `${base}/cart`,
    paymentProcessing: (orderId: string) => websiteId ? `${base}/payment-processing?orderId=${orderId}` : `${base}/payment-processing/${orderId}`,
    orderConfirmation: (orderId: string) => websiteId ? `${base}/order-confirmation?orderId=${orderId}` : `${base}/order-confirmation/${orderId}`,
  };
};
