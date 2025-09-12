import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useCart } from '@/contexts/CartContext';
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePixelTracking } from '@/hooks/usePixelTracking';

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

export const SearchResults: React.FC = () => {
  const { slug, websiteId } = useParams<{ slug?: string; websiteId?: string }>();
  const [searchParams] = useSearchParams();
  const { store, loadStore, loadStoreById } = useStore();
  const { addItem } = useCart();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const searchQuery = searchParams.get('q') || '';

  // Get pixel configuration - stores don't have direct pixel settings anymore
  const pixelConfig = store ? {
    facebook_pixel_id: (store as any)?.facebook_pixel_id,
    google_analytics_id: (store as any)?.google_analytics_id,
    google_ads_id: (store as any)?.google_ads_id,
  } : undefined;

  const { trackSearch } = usePixelTracking(pixelConfig, store?.id, websiteId);

  useEffect(() => {
    const init = async () => {
      if (slug) {
        loadStore(slug);
      } else if (websiteId) {
        const { data: website } = await supabase
          .from('websites')
          .select('store_id')
          .eq('id', websiteId)
          .single();
        if (website?.store_id) {
          await loadStoreById(website.store_id);
        }
      }
    };
    init();
  }, [slug, websiteId, loadStore, loadStoreById]);

  useEffect(() => {
    if (store && searchQuery) {
      fetchSearchResults();
    }
  }, [store, searchQuery]);

  const fetchSearchResults = async () => {
    if (!store || !searchQuery) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%`)
        .order('name');

      if (error) throw error;
      
      const products = data?.map(product => ({
        ...product,
        images: Array.isArray(product.images) ? product.images.filter(img => typeof img === 'string') as string[] : [],
      })) || [];
      
      setProducts(products);

      // Track search event with results count
      trackSearch({
        search_string: searchQuery,
        content_category: 'product',
      });
    } catch (error) {
      console.error('Error fetching search results:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      id: `${product.id}-default`,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
    });
  };

  if (!store) {
    return (
      <StorefrontLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Store not found</h1>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  const isWebsiteContext = Boolean(websiteId);

  const content = (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Search Results for "{searchQuery}"
        </h1>
        <p className="text-muted-foreground">
          {loading ? 'Searching...' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square bg-muted animate-pulse" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">
            No products found for "{searchQuery}"
          </p>
          <Link to={require('@/lib/pathResolver').useEcomPaths().products}>
            <Button variant="outline">Browse All Products</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={product.images[0] || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.compare_price && product.compare_price > product.price && (
                  <Badge variant="destructive" className="absolute top-2 left-2">
                    Sale
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <Link to={require('@/lib/pathResolver').useEcomPaths().productDetail(product.slug)}>
                  <h3 className="font-semibold text-sm mb-1 hover:text-primary transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                {product.short_description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {product.short_description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-sm">৳{product.price.toFixed(2)}</span>
                      {product.compare_price && product.compare_price > product.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          ৳{product.compare_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    className="shrink-0"
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (isWebsiteContext) {
    return content;
  }

  return (
    <StorefrontLayout>
      {content}
    </StorefrontLayout>
  );
};