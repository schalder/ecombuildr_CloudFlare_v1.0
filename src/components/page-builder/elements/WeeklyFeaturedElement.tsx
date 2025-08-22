import React, { useState, useEffect } from 'react';
import { Trophy, Star, ShoppingCart, Heart } from 'lucide-react';
import { PageBuilderElement, ElementType } from '../types';
import { elementRegistry } from './ElementRegistry';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/hooks/useUserStore';
import { formatCurrency } from '@/lib/currency';
import { renderElementStyles } from '@/components/page-builder/utils/styleRenderer';
import { useAddToCart } from '@/contexts/AddToCartProvider';

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  images: any[];
  slug: string;
  short_description?: string;
  description?: string;
  is_active: boolean;
}

const WeeklyFeaturedElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing = false, deviceType = 'desktop', onUpdate }) => {
  const { store } = useUserStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useAddToCart();
  
  // Get content from element
  const content = element.content || {};
  const {
    title = 'Weekly Best Selling',
    subtitle = '',
    layout = 'hero',
    showBadge = true,
    badgeText = 'WEEKLY PICK',
    selectedProducts = [],
    limit = 4,
    showDescription = false
  } = content;
  
  // Get responsive styles for this element
  const appliedStyles = renderElementStyles(element, deviceType);

  useEffect(() => {
    if (store?.id) {
      fetchProducts();
    }
  }, [store?.id, content]);

  const fetchProducts = async () => {
    if (!store?.id) return;
    
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*')
      .eq('store_id', store.id)
      .eq('is_active', true);

    if (selectedProducts?.length > 0) {
      query = query.in('id', selectedProducts);
    }

    query = query.limit(limit || 4);

    const { data, error } = await query;

    if (!error && data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  const handleAddToCart = (product: Product) => {
    if (!isEditing) {
      addToCart(product);
    }
  };

  const renderHeroLayout = () => {
    const featuredProduct = products[0];
    if (!featuredProduct) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="relative">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 p-8">
            {featuredProduct.images && Array.isArray(featuredProduct.images) && featuredProduct.images[0] ? (
              <img
                src={featuredProduct.images[0]}
                alt={featuredProduct.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full bg-muted rounded-xl flex items-center justify-center">
                <span className="text-muted-foreground">No Image</span>
              </div>
            )}
          </div>
          
          {showBadge && (
            <Badge className="absolute -top-4 left-4 bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">
              <Trophy className="w-4 h-4 mr-1" />
              {badgeText}
            </Badge>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-3xl font-bold mb-2">{featuredProduct.name}</h3>
            {showDescription && featuredProduct.description && (
              <p className="text-muted-foreground leading-relaxed">
                {featuredProduct.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-primary text-primary" />
            ))}
            <span className="text-sm text-muted-foreground ml-2">(4.8 - 127 reviews)</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl font-bold text-primary">
              {formatCurrency(featuredProduct.price)}
            </span>
            {featuredProduct.compare_price && featuredProduct.compare_price > featuredProduct.price && (
              <span className="text-xl text-muted-foreground line-through">
                {formatCurrency(featuredProduct.compare_price)}
              </span>
            )}
          </div>

          <div className="flex gap-4">
            <Button size="lg" className="px-8" onClick={() => handleAddToCart(featuredProduct)}>
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>
            <Button variant="outline" size="lg">
              <Heart className="w-5 h-5 mr-2" />
              Wishlist
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderGridLayout = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <Card key={product.id} className="group/card hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="relative aspect-square overflow-hidden">
            {product.images && Array.isArray(product.images) && product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No Image</span>
              </div>
            )}
            
            {showBadge && index === 0 && (
              <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                <Trophy className="w-3 h-3 mr-1" />
                {badgeText}
              </Badge>
            )}
          </div>

          <CardContent className="p-4">
            <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h3>
            
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-primary text-primary" />
              ))}
              <span className="text-xs text-muted-foreground ml-1">(4.5)</span>
            </div>

            <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2 mb-3">
              <span className="font-bold text-primary text-base md:text-lg">
                {formatCurrency(product.price)}
              </span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-xs md:text-sm text-muted-foreground line-through">
                  {formatCurrency(product.compare_price)}
                </span>
              )}
            </div>

            <Button size="sm" className="w-full" onClick={() => handleAddToCart(product)}>
              <ShoppingCart className="w-4 h-4 mr-1" />
              Add to Cart
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <section style={appliedStyles}>
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <div className="h-8 bg-muted rounded w-64 mx-auto mb-2"></div>
            <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
          </div>
          <div className="h-80 bg-muted rounded-lg"></div>
        </div>
      </section>
    );
  }

  return (
    <section style={appliedStyles}>
      <div className="container mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-3xl font-bold mb-2">{title}</h2>
            )}
            {subtitle && (
              <p className="text-muted-foreground text-lg">{subtitle}</p>
            )}
          </div>
        )}

        {layout === 'hero' ? renderHeroLayout() : renderGridLayout()}

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No featured products found</p>
          </div>
        )}
      </div>
    </section>
  );
};

// Weekly Featured Element Type Definition
const weeklyFeaturedElementType: ElementType = {
  id: 'weekly-featured',
  name: 'Weekly Featured',
  component: WeeklyFeaturedElement,
  icon: Trophy,
  category: 'ecommerce',
  defaultContent: {
    title: 'Weekly Best Selling',
    subtitle: 'Top selling products this week',
    layout: 'hero',
    showBadge: true,
    badgeText: 'WEEKLY PICK',
    selectedProducts: [],
    limit: 4,
    showDescription: false
  },
  description: 'Showcase your weekly featured products'
};

// Register element
export const registerWeeklyFeaturedElement = () => {
  elementRegistry.register(weeklyFeaturedElementType);
};