import React, { useState, useEffect } from 'react';
import { Trophy, Star, ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BlockEditProps, BlockSaveProps } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/hooks/useUserStore';
import { formatCurrency } from '@/lib/currency';

interface WeeklyFeaturedContent {
  title: string;
  subtitle: string;
  layout: 'hero' | 'grid' | 'carousel';
  showBadge: boolean;
  badgeText: string;
  selectedProducts: string[];
  limit: number;
  showDescription: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  images: any;
  slug: string;
  short_description?: string;
  description?: string;
}

const WeeklyFeaturedEdit: React.FC<BlockEditProps> = ({ 
  block, 
  onUpdate, 
  onRemove, 
  onDuplicate, 
  isSelected, 
  onSelect 
}) => {
  const { store } = useUserStore();
  const [products, setProducts] = useState<Product[]>([]);
  const content = block.content as WeeklyFeaturedContent;

  useEffect(() => {
    if (store?.id) {
      fetchProducts();
    }
  }, [store?.id]);

  const fetchProducts = async () => {
    if (!store?.id) return;
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', store.id)
      .eq('is_active', true);

    if (!error && data) {
      setProducts(data);
    }
  };

  const handleProductToggle = (productId: string) => {
    const selectedProducts = content.selectedProducts || [];
    const updated = selectedProducts.includes(productId)
      ? selectedProducts.filter(id => id !== productId)
      : [...selectedProducts, productId];
    
    onUpdate({ selectedProducts: updated });
  };

  return (
    <div 
      className={`border-2 rounded-lg p-4 ${isSelected ? 'border-primary' : 'border-border'}`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          <span className="font-medium">Weekly Featured</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDuplicate}>
            Copy
          </Button>
          <Button variant="destructive" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Section Title</Label>
          <Input
            id="title"
            value={content.title || 'Weekly Best Selling'}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Weekly Best Selling"
          />
        </div>

        <div>
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={content.subtitle || ''}
            onChange={(e) => onUpdate({ subtitle: e.target.value })}
            placeholder="This week's top picks"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="layout">Layout Style</Label>
            <Select value={content.layout || 'hero'} onValueChange={(value) => onUpdate({ layout: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hero">Hero Featured</SelectItem>
                <SelectItem value="grid">Grid Layout</SelectItem>
                <SelectItem value="carousel">Carousel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="limit">Product Limit</Label>
            <Input
              id="limit"
              type="number"
              value={content.limit || 4}
              onChange={(e) => onUpdate({ limit: parseInt(e.target.value) })}
              min="1"
              max="10"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="showBadge">Show Featured Badge</Label>
            <Switch
              id="showBadge"
              checked={content.showBadge !== false}
              onCheckedChange={(checked) => onUpdate({ showBadge: checked })}
            />
          </div>

          {content.showBadge !== false && (
            <div>
              <Label htmlFor="badgeText">Badge Text</Label>
              <Input
                id="badgeText"
                value={content.badgeText || 'WEEKLY PICK'}
                onChange={(e) => onUpdate({ badgeText: e.target.value })}
                placeholder="WEEKLY PICK"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="showDescription">Show Description</Label>
            <Switch
              id="showDescription"
              checked={content.showDescription || false}
              onCheckedChange={(checked) => onUpdate({ showDescription: checked })}
            />
          </div>
        </div>

        <div>
          <Label>Select Featured Products</Label>
          <div className="max-h-40 overflow-y-auto mt-2 space-y-2">
            {products.map((product) => (
              <div key={product.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`featured-product-${product.id}`}
                  checked={content.selectedProducts?.includes(product.id) || false}
                  onChange={() => handleProductToggle(product.id)}
                  className="rounded"
                />
                <label htmlFor={`featured-product-${product.id}`} className="text-sm">
                  {product.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const WeeklyFeaturedSave: React.FC<BlockSaveProps> = ({ block }) => {
  const { store } = useUserStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const content = block.content as WeeklyFeaturedContent;

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

    if (content.selectedProducts?.length > 0) {
      query = query.in('id', content.selectedProducts);
    }

    query = query.limit(content.limit || 4);

    const { data, error } = await query;

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
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
          
          {content.showBadge !== false && (
            <Badge className="absolute -top-4 left-4 bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">
              <Trophy className="w-4 h-4 mr-1" />
              {content.badgeText || 'WEEKLY PICK'}
            </Badge>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-3xl font-bold mb-2">{featuredProduct.name}</h3>
            {content.showDescription && featuredProduct.description && (
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
            <Button size="lg" className="px-8">
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
        <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="relative aspect-square overflow-hidden">
            {product.images && Array.isArray(product.images) && product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No Image</span>
              </div>
            )}
            
            {content.showBadge !== false && index === 0 && (
              <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                <Trophy className="w-3 h-3 mr-1" />
                {content.badgeText || 'WEEKLY PICK'}
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

            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-primary">
                {formatCurrency(product.price)}
              </span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(product.compare_price)}
                </span>
              )}
            </div>

            <Button size="sm" className="w-full">
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
      <section className="py-12 px-4">
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
    <section className="py-12 px-4">
      <div className="container mx-auto">
        {(content.title || content.subtitle) && (
          <div className="text-center mb-12">
            {content.title && (
              <h2 className="text-3xl font-bold mb-2">{content.title}</h2>
            )}
            {content.subtitle && (
              <p className="text-muted-foreground text-lg">{content.subtitle}</p>
            )}
          </div>
        )}

        {content.layout === 'hero' ? renderHeroLayout() : renderGridLayout()}

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No featured products found</p>
          </div>
        )}
      </div>
    </section>
  );
};

export const weeklyFeaturedBlock = {
  name: 'theme/weekly-featured',
  settings: {
    name: 'theme/weekly-featured',
    title: 'Weekly Featured',
    icon: Trophy,
    category: 'store' as const,
    supports: {
      alignment: true,
      spacing: true,
      color: true,
    },
  },
  edit: WeeklyFeaturedEdit,
  save: WeeklyFeaturedSave,
};