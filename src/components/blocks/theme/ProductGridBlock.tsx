import React, { useState, useEffect } from 'react';
import { Grid, Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlockEditProps, BlockSaveProps } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/hooks/useUserStore';
import { formatCurrency } from '@/lib/currency';

interface ProductGridContent {
  title: string;
  subtitle: string;
  columns: number;
  limit: number;
  showPrices: boolean;
  showRatings: boolean;
  showQuickAdd: boolean;
  showSaleBadges: boolean;
  layout: 'grid' | 'organic';
  selectedProducts: string[];
  filterByCategory: boolean;
  categoryId: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  images: any;
  slug: string;
  category_id?: string;
  short_description?: string;
}

const ProductGridEdit: React.FC<BlockEditProps> = ({ 
  block, 
  onUpdate, 
  onRemove, 
  onDuplicate, 
  isSelected, 
  onSelect 
}) => {
  const { store } = useUserStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const content = block.content as ProductGridContent;

  useEffect(() => {
    if (store?.id) {
      fetchProducts();
      fetchCategories();
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

  const fetchCategories = async () => {
    if (!store?.id) return;
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', store.id);

    if (!error && data) {
      setCategories(data);
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
          <Grid className="w-4 h-4" />
          <span className="font-medium">Product Grid</span>
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
            value={content.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Featured Products"
          />
        </div>

        <div>
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={content.subtitle || ''}
            onChange={(e) => onUpdate({ subtitle: e.target.value })}
            placeholder="Shop our best products"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="columns">Columns</Label>
            <Select value={content.columns?.toString() || '4'} onValueChange={(value) => onUpdate({ columns: parseInt(value) })}>
              <SelectTrigger>
                <SelectValue placeholder="Select columns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Columns</SelectItem>
                <SelectItem value="3">3 Columns</SelectItem>
                <SelectItem value="4">4 Columns</SelectItem>
                <SelectItem value="5">5 Columns</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="limit">Product Limit</Label>
            <Input
              id="limit"
              type="number"
              value={content.limit || 8}
              onChange={(e) => onUpdate({ limit: parseInt(e.target.value) })}
              min="1"
              max="50"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="layout">Layout Style</Label>
          <Select value={content.layout || 'grid'} onValueChange={(value) => onUpdate({ layout: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Clean Grid</SelectItem>
              <SelectItem value="organic">Organic Cards</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="showPrices">Show Prices</Label>
            <Switch
              id="showPrices"
              checked={content.showPrices !== false}
              onCheckedChange={(checked) => onUpdate({ showPrices: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showRatings">Show Ratings</Label>
            <Switch
              id="showRatings"
              checked={content.showRatings || false}
              onCheckedChange={(checked) => onUpdate({ showRatings: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showQuickAdd">Quick Add to Cart</Label>
            <Switch
              id="showQuickAdd"
              checked={content.showQuickAdd || false}
              onCheckedChange={(checked) => onUpdate({ showQuickAdd: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showSaleBadges">Show Sale Badges</Label>
            <Switch
              id="showSaleBadges"
              checked={content.showSaleBadges !== false}
              onCheckedChange={(checked) => onUpdate({ showSaleBadges: checked })}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="filterByCategory">Filter by Category</Label>
            <Switch
              id="filterByCategory"
              checked={content.filterByCategory || false}
              onCheckedChange={(checked) => onUpdate({ filterByCategory: checked })}
            />
          </div>

          {content.filterByCategory && (
            <div>
              <Label htmlFor="categoryId">Select Category</Label>
              <Select value={content.categoryId || 'all'} onValueChange={(value) => onUpdate({ categoryId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Separator />

        <div>
          <Label>Select Specific Products (Optional)</Label>
          <div className="max-h-40 overflow-y-auto mt-2 space-y-2">
            {products.map((product) => (
              <div key={product.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`product-${product.id}`}
                  checked={content.selectedProducts?.includes(product.id) || false}
                  onChange={() => handleProductToggle(product.id)}
                  className="rounded"
                />
                <label htmlFor={`product-${product.id}`} className="text-sm">
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

const ProductGridSave: React.FC<BlockSaveProps> = ({ block }) => {
  const { store } = useUserStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const content = block.content as ProductGridContent;

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

    // Filter by category if specified
    if (content.filterByCategory && content.categoryId && content.categoryId !== 'all') {
      query = query.eq('category_id', content.categoryId);
    }

    // Filter by selected products if specified
    if (content.selectedProducts?.length > 0) {
      query = query.in('id', content.selectedProducts);
    }

    query = query.limit(content.limit || 8);

    const { data, error } = await query;

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const calculateDiscount = (price: number, comparePrice?: number) => {
    if (!comparePrice || comparePrice <= price) return 0;
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  };

  const gridClasses = content.layout === 'organic' 
    ? 'grid gap-6' 
    : 'grid gap-4';

  const columnClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
  };

  if (loading) {
    return (
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <div className="h-8 bg-muted rounded w-64 mx-auto mb-2"></div>
            <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
          </div>
          <div className={`${gridClasses} ${columnClasses[content.columns || 4]}`}>
            {Array.from({ length: content.limit || 8 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-lg h-80"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        {(content.title || content.subtitle) && (
          <div className="text-center mb-8">
            {content.title && (
              <h2 className="text-3xl font-bold mb-2">{content.title}</h2>
            )}
            {content.subtitle && (
              <p className="text-muted-foreground text-lg">{content.subtitle}</p>
            )}
          </div>
        )}

        <div className={`${gridClasses} ${columnClasses[content.columns || 4]}`}>
          {products.map((product) => {
            const discount = calculateDiscount(product.price, product.compare_price);
            const cardClass = content.layout === 'organic' 
              ? 'bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden'
              : 'bg-card rounded-lg border hover:shadow-md transition-all duration-300 overflow-hidden';

            return (
              <Card key={product.id} className={cardClass}>
                <div className="relative aspect-square overflow-hidden">
                  {product.images && Array.isArray(product.images) && product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No Image</span>
                    </div>
                  )}
                  
                  {content.showSaleBadges && discount > 0 && (
                    <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
                      -{discount}%
                    </Badge>
                  )}

                  <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>

                  {content.showQuickAdd && (
                    <div className="absolute bottom-2 left-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                      <Button size="sm" className="w-full">
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Quick Add
                      </Button>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h3>
                  
                  {product.short_description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      {product.short_description}
                    </p>
                  )}

                  {content.showRatings && (
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">(4.5)</span>
                    </div>
                  )}

                  {content.showPrices && (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">
                        {formatCurrency(product.price)}
                      </span>
                      {product.compare_price && product.compare_price > product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(product.compare_price)}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        )}
      </div>
    </section>
  );
};

export const productGridBlock = {
  name: 'core/product-grid',
  settings: {
    name: 'core/product-grid',
    title: 'Product Grid',
    icon: Grid,
    category: 'store' as const,
    supports: {
      alignment: true,
      spacing: true,
      color: true,
    },
  },
  edit: ProductGridEdit,
  save: ProductGridSave,
};