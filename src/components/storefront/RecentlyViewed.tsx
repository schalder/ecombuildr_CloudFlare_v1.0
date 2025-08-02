import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductCard } from './ProductCard';
import { Clock } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  short_description?: string;
  images: string[];
  slug: string;
  is_active: boolean;
}

interface RecentlyViewedProps {
  storeSlug: string;
  onAddToCart: (product: Product) => void;
  onQuickView?: (product: Product) => void;
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({
  storeSlug,
  onAddToCart,
  onQuickView
}) => {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Get recently viewed products from localStorage
    const recent = localStorage.getItem(`recently-viewed-${storeSlug}`);
    if (recent) {
      try {
        const products = JSON.parse(recent);
        setRecentProducts(products.slice(0, 4)); // Show max 4 products
      } catch (error) {
        console.error('Error parsing recently viewed products:', error);
      }
    }
  }, [storeSlug]);

  const addToRecentlyViewed = (product: Product) => {
    const recent = localStorage.getItem(`recently-viewed-${storeSlug}`);
    let products: Product[] = [];
    
    if (recent) {
      try {
        products = JSON.parse(recent);
      } catch (error) {
        console.error('Error parsing recently viewed products:', error);
      }
    }

    // Remove if already exists and add to beginning
    products = products.filter(p => p.id !== product.id);
    products.unshift(product);
    
    // Keep only last 10 products
    products = products.slice(0, 10);
    
    localStorage.setItem(`recently-viewed-${storeSlug}`, JSON.stringify(products));
    setRecentProducts(products.slice(0, 4));
  };

  // Expose function globally so it can be called from product detail page
  useEffect(() => {
    (window as any).addToRecentlyViewed = addToRecentlyViewed;
  }, []);

  if (recentProducts.length === 0) {
    return null;
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recently Viewed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentProducts.map((product, index) => (
            <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <ProductCard
                product={product}
                storeSlug={storeSlug}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView}
                className="h-full"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
