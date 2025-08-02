import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BlockEditProps, BlockSaveProps } from '../types';
import { Settings, Trash2, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { ProductCard } from '@/components/storefront/ProductCard';

interface FeaturedProductsContent {
  title: string;
  limit: number;
  layout: 'grid' | 'organic';
  showPrice: boolean;
  selectedProducts?: string[];
}

interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  images: any;
  slug: string;
  is_active?: boolean;
}

export const FeaturedProductsEdit: React.FC<BlockEditProps> = ({ 
  block, 
  onUpdate, 
  onRemove, 
  onDuplicate, 
  isSelected, 
  onSelect 
}) => {
  const content = block.content as FeaturedProductsContent;
  const { store } = useStore();
  const [products, setProducts] = useState<FeaturedProduct[]>([]);

  useEffect(() => {
    if (store?.id) {
      fetchProducts();
    }
  }, [store?.id]);

  const fetchProducts = async () => {
    if (!store?.id) return;

    const { data } = await supabase
      .from('products')
      .select('id, name, price, images, slug')
      .eq('store_id', store.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) {
      setProducts(data);
    }
  };

  const toggleProduct = (productId: string) => {
    const selected = content.selectedProducts || [];
    const newSelected = selected.includes(productId)
      ? selected.filter(id => id !== productId)
      : [...selected, productId];
    
    onUpdate({ selectedProducts: newSelected });
  };

  return (
    <div 
      className={`relative group cursor-pointer border-2 transition-all ${
        isSelected ? 'border-primary' : 'border-transparent hover:border-muted-foreground/20'
      }`}
      onClick={onSelect}
    >
      {/* Block Toolbar */}
      {isSelected && (
        <div className="absolute -top-10 left-0 flex items-center gap-2 bg-background border rounded-md px-2 py-1 z-10">
          <Settings className="h-4 w-4" />
          <span className="text-sm font-medium">Featured Products</span>
          <Button variant="ghost" size="sm" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Edit Form */}
      {isSelected && (
        <div className="absolute top-0 right-0 w-96 bg-background border rounded-lg p-4 shadow-lg z-20 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Section Title</Label>
              <Input
                id="title"
                value={content.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Featured Products"
              />
            </div>
            
            <div>
              <Label htmlFor="limit">Number of Products</Label>
              <Input
                id="limit"
                type="number"
                value={content.limit}
                onChange={(e) => onUpdate({ limit: parseInt(e.target.value) })}
                min="1"
                max="12"
              />
            </div>

            <div>
              <Label htmlFor="layout">Layout Style</Label>
              <Select value={content.layout} onValueChange={(value) => onUpdate({ layout: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="organic">Organic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Featured Products</Label>
              <div className="max-h-48 overflow-y-auto space-y-2 mt-2">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={content.selectedProducts?.includes(product.id) || false}
                      onChange={() => toggleProduct(product.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{product.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      <FeaturedProductsSave block={block} />
    </div>
  );
};

export const FeaturedProductsSave: React.FC<BlockSaveProps> = ({ block }) => {
  const content = block.content as FeaturedProductsContent;
  const { store } = useStore();
  const [products, setProducts] = useState<FeaturedProduct[]>([]);

  useEffect(() => {
    if (store?.id) {
      fetchProducts();
    }
  }, [store?.id, content.selectedProducts]);

  const fetchProducts = async () => {
    if (!store?.id) return;

    let query = supabase
      .from('products')
      .select('id, name, price, images, slug')
      .eq('store_id', store.id)
      .eq('is_active', true);

    if (content.selectedProducts?.length) {
      query = query.in('id', content.selectedProducts);
    }

    const { data } = await query
      .limit(content.limit)
      .order('created_at', { ascending: false });

    if (data) {
      setProducts(data);
    }
  };

  const gridClass = content.layout === 'organic' 
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6';

  return (
    <section className="py-16">
      <div className="container">
        <h2 className={`text-3xl font-bold text-center mb-12 ${
          content.layout === 'organic' ? 'font-serif text-green-900' : 'text-foreground'
        }`}>
          {content.title}
        </h2>
        
        <div className={gridClass}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{...product, is_active: true, images: Array.isArray(product.images) ? product.images : []}}
              storeSlug={store?.slug || ''}
              onAddToCart={() => {}}
              onQuickView={() => {}}
            />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products selected. Configure this section to display your featured products.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export const featuredProductsBlock = {
  name: 'featured_products',
  settings: {
    name: 'featured_products',
    title: 'Featured Products',
    icon: () => <div className="w-4 h-4 bg-orange-500 rounded"></div>,
    category: 'store' as const,
    supports: {
      alignment: false,
      spacing: true,
      color: false,
    },
  },
  edit: FeaturedProductsEdit,
  save: FeaturedProductsSave,
};