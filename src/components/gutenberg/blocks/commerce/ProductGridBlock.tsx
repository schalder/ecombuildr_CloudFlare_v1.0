import React, { useState, useEffect } from 'react';
import { ShoppingBag, Star, Heart, ShoppingCart, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/hooks/useUserStore';
import { GutenbergBlockEditProps, GutenbergBlockSaveProps } from '../../types';

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  images: any;
  description?: string;
  inventory_quantity?: number;
}

const ProductGridEdit: React.FC<GutenbergBlockEditProps> = ({
  block,
  setAttributes
}) => {
  const { store } = useUserStore();
  
  const title = block.content.title || 'Featured Products';
  const subtitle = block.content.subtitle || '';
  const columns = block.content.columns || 3;
  const limit = block.content.limit || 6;
  const showRating = block.content.showRating || false;
  const showQuickAdd = block.content.showQuickAdd || true;
  const showWishlist = block.content.showWishlist || false;
  const showStock = block.content.showStock || false;

  return (
    <div className="space-y-6 p-6 border rounded-lg bg-background">
      <div className="flex items-center gap-2">
        <ShoppingBag className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Product Grid Settings</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Section Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setAttributes({ title: e.target.value })}
            placeholder="Featured Products"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={subtitle}
            onChange={(e) => setAttributes({ subtitle: e.target.value })}
            placeholder="Optional subtitle"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="columns">Columns</Label>
          <Select value={columns.toString()} onValueChange={(value) => setAttributes({ columns: parseInt(value) })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Columns</SelectItem>
              <SelectItem value="3">3 Columns</SelectItem>
              <SelectItem value="4">4 Columns</SelectItem>
              <SelectItem value="5">5 Columns</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="limit">Products to Show</Label>
          <Input
            id="limit"
            type="number"
            min="1"
            max="50"
            value={limit}
            onChange={(e) => setAttributes({ limit: parseInt(e.target.value) || 6 })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Display Options</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-rating">Show Rating</Label>
            <Switch
              id="show-rating"
              checked={showRating}
              onCheckedChange={(checked) => setAttributes({ showRating: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-quick-add">Quick Add Button</Label>
            <Switch
              id="show-quick-add"
              checked={showQuickAdd}
              onCheckedChange={(checked) => setAttributes({ showQuickAdd: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-wishlist">Wishlist Button</Label>
            <Switch
              id="show-wishlist"
              checked={showWishlist}
              onCheckedChange={(checked) => setAttributes({ showWishlist: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-stock">Stock Status</Label>
            <Switch
              id="show-stock"
              checked={showStock}
              onCheckedChange={(checked) => setAttributes({ showStock: checked })}
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Preview</h4>
        <div className="text-center mb-4">
          {title && <h2 className="text-xl font-bold">{title}</h2>}
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${Math.min(columns, 3)}, 1fr)` }}>
          {Array.from({ length: Math.min(limit, 3) }, (_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square bg-muted/50 flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm">Sample Product {i + 1}</h3>
                <p className="text-sm text-muted-foreground">$29.99</p>
                {showRating && (
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }, (_, j) => (
                      <Star key={j} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                )}
                {showQuickAdd && (
                  <Button size="sm" className="w-full mt-2 h-7 text-xs">
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Add to Cart
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProductGridSave: React.FC<GutenbergBlockSaveProps> = ({ block }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { store } = useUserStore();

  const title = block.content.title || 'Featured Products';
  const subtitle = block.content.subtitle || '';
  const columns = block.content.columns || 3;
  const limit = block.content.limit || 6;
  const showRating = block.content.showRating || false;
  const showQuickAdd = block.content.showQuickAdd || true;
  const showWishlist = block.content.showWishlist || false;
  const showStock = block.content.showStock || false;

  useEffect(() => {
    const fetchProducts = async () => {
      if (!store?.id) return;

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', store.id)
          .eq('is_active', true)
          .limit(limit);

        if (error) throw error;
        setProducts((data || []) as Product[]);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [store?.id, limit]);

  const renderRating = (rating: number = 4.5) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i < Math.floor(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">({rating})</span>
    </div>
  );

  const getDiscountPercentage = (price: number, comparePrice?: number) => {
    if (!comparePrice || comparePrice <= price) return null;
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          {title && <h2 className="text-2xl font-bold mb-2">{title}</h2>}
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`grid gap-6`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: limit }, (_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="aspect-square bg-muted" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        {title && <h2 className="text-2xl font-bold mb-2">{title}</h2>}
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>

      <div className={`grid gap-6`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {products.map((product) => {
          const mainImage = Array.isArray(product.images) 
            ? product.images?.[0]?.url || product.images?.[0]
            : typeof product.images === 'string' 
              ? product.images 
              : null;
          const discount = getDiscountPercentage(product.price, product.compare_price);

          return (
            <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square overflow-hidden">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Package className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}

                {discount && (
                  <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
                    -{discount}%
                  </Badge>
                )}

                {showStock && product.inventory_quantity !== undefined && (
                  <Badge 
                    variant={product.inventory_quantity > 0 ? "default" : "destructive"}
                    className="absolute top-2 right-2"
                  >
                    {product.inventory_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                )}

                {showWishlist && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 w-8 h-8 p-0 bg-background/80 hover:bg-background"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <CardContent className="p-4 space-y-2">
                <h3 className="font-medium line-clamp-2">{product.name}</h3>
                
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">${product.price}</span>
                      {product.compare_price && product.compare_price > product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.compare_price}
                        </span>
                      )}
                    </div>
                    {showRating && renderRating()}
                  </div>
                </div>

                {showQuickAdd && (
                  <Button className="w-full" size="sm">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-2" />
          <p>No products found</p>
        </div>
      )}
    </div>
  );
};

export const productGridBlock = {
  name: 'commerce/product-grid',
  settings: {
    name: 'commerce/product-grid',
    title: 'Product Grid',
    icon: ShoppingBag,
    category: 'commerce' as const,
    description: 'Display your products in a customizable grid layout.',
    keywords: ['products', 'shop', 'ecommerce', 'grid'],
    supports: {
      align: true,
      spacing: true,
    }
  },
  edit: ProductGridEdit,
  save: ProductGridSave
};