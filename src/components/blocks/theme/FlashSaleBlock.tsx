import React, { useState, useEffect } from 'react';
import { Clock, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BlockEditProps, BlockSaveProps } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/hooks/useUserStore';
import { formatCurrency } from '@/lib/currency';

interface FlashSaleContent {
  title: string;
  subtitle: string;
  endTime: string;
  showTimer: boolean;
  limit: number;
  selectedProducts: string[];
  salePercentage: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  images: any;
  slug: string;
  short_description?: string;
}

const FlashSaleEdit: React.FC<BlockEditProps> = ({ 
  block, 
  onUpdate, 
  onRemove, 
  onDuplicate, 
  isSelected, 
  onSelect 
}) => {
  const { store } = useUserStore();
  const [products, setProducts] = useState<Product[]>([]);
  const content = block.content as FlashSaleContent;

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
          <Clock className="w-4 h-4" />
          <span className="font-medium">Flash Sale</span>
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
            value={content.title || 'Flash Sale'}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Flash Sale"
          />
        </div>

        <div>
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={content.subtitle || ''}
            onChange={(e) => onUpdate({ subtitle: e.target.value })}
            placeholder="Limited time offers"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="endTime">Sale End Time</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={content.endTime || ''}
              onChange={(e) => onUpdate({ endTime: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="salePercentage">Sale Percentage</Label>
            <Input
              id="salePercentage"
              type="number"
              value={content.salePercentage || 20}
              onChange={(e) => onUpdate({ salePercentage: parseInt(e.target.value) })}
              min="1"
              max="90"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="limit">Product Limit</Label>
          <Input
            id="limit"
            type="number"
            value={content.limit || 6}
            onChange={(e) => onUpdate({ limit: parseInt(e.target.value) })}
            min="1"
            max="20"
          />
        </div>

        <div>
          <Label>Select Products for Flash Sale</Label>
          <div className="max-h-40 overflow-y-auto mt-2 space-y-2">
            {products.map((product) => (
              <div key={product.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`flash-product-${product.id}`}
                  checked={content.selectedProducts?.includes(product.id) || false}
                  onChange={() => handleProductToggle(product.id)}
                  className="rounded"
                />
                <label htmlFor={`flash-product-${product.id}`} className="text-sm">
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

const FlashSaleSave: React.FC<BlockSaveProps> = ({ block }) => {
  const { store } = useUserStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const content = block.content as FlashSaleContent;

  useEffect(() => {
    if (store?.id) {
      fetchProducts();
    }
  }, [store?.id, content]);

  useEffect(() => {
    if (content.endTime) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const endTime = new Date(content.endTime).getTime();
        const distance = endTime - now;

        if (distance > 0) {
          setTimeLeft({
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000)
          });
        } else {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [content.endTime]);

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

    query = query.limit(content.limit || 6);

    const { data, error } = await query;

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const calculateSalePrice = (price: number) => {
    const salePercentage = content.salePercentage || 20;
    return price * (1 - salePercentage / 100);
  };

  if (loading) {
    return (
      <section className="py-12 px-4 bg-destructive/5">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <div className="h-8 bg-muted rounded w-64 mx-auto mb-2"></div>
            <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-lg h-80"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 bg-destructive/5 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 border-4 border-destructive rounded-full"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-destructive/20 rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 border-4 border-destructive rounded-full"></div>
      </div>

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-8">
          {content.title && (
            <h2 className="text-4xl font-bold mb-2 text-destructive">{content.title}</h2>
          )}
          {content.subtitle && (
            <p className="text-muted-foreground text-lg mb-4">{content.subtitle}</p>
          )}
          
          {content.endTime && (
            <div className="flex justify-center items-center gap-4 mb-6">
              <span className="text-lg font-medium">Ends in:</span>
              <div className="flex gap-2">
                <div className="bg-destructive text-destructive-foreground px-3 py-2 rounded-lg font-bold">
                  {String(timeLeft.hours).padStart(2, '0')}
                  <div className="text-xs opacity-80">Hours</div>
                </div>
                <div className="bg-destructive text-destructive-foreground px-3 py-2 rounded-lg font-bold">
                  {String(timeLeft.minutes).padStart(2, '0')}
                  <div className="text-xs opacity-80">Minutes</div>
                </div>
                <div className="bg-destructive text-destructive-foreground px-3 py-2 rounded-lg font-bold">
                  {String(timeLeft.seconds).padStart(2, '0')}
                  <div className="text-xs opacity-80">Seconds</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const salePrice = calculateSalePrice(product.price);
            const salePercentage = content.salePercentage || 20;

            return (
              <div key={product.id} className="product-card bg-card border-2 border-destructive/20 hover:border-destructive transition-all duration-300 overflow-hidden">
                <div className="relative aspect-square overflow-hidden">
                  {product.images && Array.isArray(product.images) && product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="product-image w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No Image</span>
                    </div>
                  )}
                  
                  <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
                    -{salePercentage}%
                  </Badge>

                  <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground animate-pulse">
                    FLASH SALE
                  </Badge>

                  <div className="absolute bottom-2 left-2 right-2 opacity-0 hover:opacity-100 transition-opacity"
                       onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                       onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                    <Button size="sm" className="w-full bg-destructive hover:bg-destructive/90">
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Add to Cart
                    </Button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h3>
                  
                  {product.short_description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      {product.short_description}
                    </p>
                  )}

                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">(4.5)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-destructive text-lg">
                      {formatCurrency(salePrice)}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No flash sale products found</p>
          </div>
        )}
      </div>
    </section>
  );
};

export const flashSaleBlock = {
  name: 'theme/flash-sale',
  settings: {
    name: 'theme/flash-sale',
    title: 'Flash Sale',
    icon: Clock,
    category: 'marketing' as const,
    supports: {
      alignment: true,
      spacing: true,
      color: true,
    },
  },
  edit: FlashSaleEdit,
  save: FlashSaleSave,
};