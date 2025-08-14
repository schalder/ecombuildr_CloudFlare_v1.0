import { useEffect } from 'react';
import { usePixelTracking } from '@/hooks/usePixelTracking';

interface ProductPixelTrackerProps {
  product: {
    id: string;
    name: string;
    price: number;
    category?: string;
  };
  currency?: string;
}

export const ProductPixelTracker: React.FC<ProductPixelTrackerProps> = ({ 
  product,
  currency = 'BDT' 
}) => {
  const { trackViewContent } = usePixelTracking();

  useEffect(() => {
    if (product) {
      try {
        trackViewContent({
          content_ids: [product.id],
          content_name: product.name,
          content_category: product.category,
          value: product.price,
          currency,
          contents: [{
            id: product.id,
            quantity: 1,
            item_price: product.price,
          }],
        });
      } catch (error) {
        console.error('Error tracking product view:', error);
      }
    }
  }, [product, currency, trackViewContent]);

  return null;
};