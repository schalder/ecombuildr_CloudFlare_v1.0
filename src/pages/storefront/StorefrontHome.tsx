import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

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

interface PageData {
  id: string;
  title: string;
  content: any;
  seo_title?: string;
  seo_description?: string;
}

export const StorefrontHome: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { store, loadStore } = useStore();
  const { addItem } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [homepage, setHomepage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadStore(slug);
    }
  }, [slug, loadStore]);

  useEffect(() => {
    if (store?.id) {
      fetchHomepage();
      fetchFeaturedProducts();
    }
  }, [store?.id]);

  const fetchHomepage = async () => {
    if (!store) return;
    
    try {
      const { data } = await supabase
        .from('pages')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_homepage', true)
        .eq('is_published', true)
        .maybeSingle();

      setHomepage(data);
    } catch (error) {
      console.error('Error fetching homepage:', error);
    }
  };


  const fetchFeaturedProducts = async () => {
    if (!store) return;
    
    try {
      setLoading(true);
      console.log('Fetching products for store:', store.id);
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, description, short_description, price, compare_price, images, is_active')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .limit(8);

      console.log('Products query result:', { data, error });

      if (error) {
        console.error('Products query error:', error);
        setFeaturedProducts([]);
        return;
      }
      
      const products = data?.map(product => ({
        ...product,
        images: Array.isArray(product.images) ? product.images.filter(img => typeof img === 'string') as string[] : [],
      })) || [];
      
      console.log('Processed products:', products);
      setFeaturedProducts(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      setFeaturedProducts([]);
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

  return (
    <StorefrontLayout>
      {/* Hero Section */}
      {homepage?.content?.sections?.find((s: any) => s.type === 'hero') ? (
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
          <div className="container mx-auto px-4 text-center">
            {homepage.content.sections.map((section: any, index: number) => {
              if (section.type === 'hero') {
                return (
                  <div key={index}>
                    <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
                      {section.title || `Welcome to ${store.name}`}
                    </h1>
                    {section.subtitle && (
                      <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        {section.subtitle}
                      </p>
                    )}
                    <Link to={section.ctaLink || `/store/${store.slug}/products`}>
                      <Button size="lg" className="text-lg px-8 py-3">
                        {section.ctaText || 'Shop Now'}
                      </Button>
                    </Link>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              Welcome to {store.name}
            </h1>
            {store.description && (
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {store.description}
              </p>
            )}
            <Link to={`/store/${store.slug}/products`}>
              <Button size="lg" className="text-lg px-8 py-3">
                Shop Now
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Featured Products</h2>
            <p className="text-muted-foreground">Discover our best-selling items</p>
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
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
                    <Link to={`/store/${store.slug}/products/${product.slug}`}>
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

          {!loading && featuredProducts.length > 0 && (
            <div className="text-center mt-12">
              <Link to={`/store/${store.slug}/products`}>
                <Button variant="outline" size="lg">
                  View All Products
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Start Shopping?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Browse our complete collection of products and find exactly what you're looking for.
          </p>
          <Link to={`/store/${store.slug}/products`}>
            <Button size="lg">
              Browse All Products
            </Button>
          </Link>
        </div>
      </section>
    </StorefrontLayout>
  );
};