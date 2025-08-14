import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductCard } from './ProductCard';
import { Clock } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number | null;
  short_description?: string | null;
  description?: string | null;
  images: any; // Json type from Supabase
  slug: string;
  is_active: boolean;
  track_inventory?: boolean;
  inventory_quantity?: number | null;
  variations?: any; // Json type from Supabase
  store_id?: string;
  category_id?: string | null;
  sku?: string | null;
  cost_price?: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
  free_shipping_min_amount?: number | null;
  easy_returns_enabled?: boolean;
  easy_returns_days?: number | null;
  action_buttons?: any;
  allowed_payment_methods?: string[] | null;
  created_at?: string;
  updated_at?: string;
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
