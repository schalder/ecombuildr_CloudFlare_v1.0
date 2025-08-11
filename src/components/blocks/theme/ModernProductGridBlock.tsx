import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BlockEditProps, BlockSaveProps, BlockRegistration } from '../types';
import { Grid, Star, Heart, ShoppingCart, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';

interface ModernProductGridContent {
  title: string;
  subtitle: string;
  columns: number;
  showRating: boolean;
  showQuickAdd: boolean;
  showWishlist: boolean;
  showStock: boolean;
  limit: number;
  ctaBehavior?: 'add_to_cart' | 'buy_now';
  ctaText?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  images: any;
  short_description?: string;
}

const ModernProductGridEdit: React.FC<BlockEditProps> = ({ block, onUpdate }) => {
  const content = block.content as ModernProductGridContent;

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">Modern Product Grid</h3>
      
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
          placeholder="Discover our top-rated products"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="columns">Columns</Label>
          <Input
            id="columns"
            type="number"
            min="2"
            max="6"
            value={content.columns || 4}
            onChange={(e) => onUpdate({ columns: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="limit">Products Limit</Label>
          <Input
            id="limit"
            type="number"
            min="4"
            max="20"
            value={content.limit || 8}
            onChange={(e) => onUpdate({ limit: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Display Options</Label>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={content.showRating !== false}
              onChange={(e) => onUpdate({ showRating: e.target.checked })}
            />
            <span className="text-sm">Show Rating</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={content.showQuickAdd !== false}
              onChange={(e) => onUpdate({ showQuickAdd: e.target.checked })}
            />
            <span className="text-sm">Quick Add Button</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={content.showWishlist !== false}
              onChange={(e) => onUpdate({ showWishlist: e.target.checked })}
            />
            <span className="text-sm">Wishlist Button</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={content.showStock !== false}
              onChange={(e) => onUpdate({ showStock: e.target.checked })}
            />
            <span className="text-sm">Stock Status</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">CTA</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Behavior</Label>
            <select
              className="w-full border rounded px-2 py-1 text-sm"
              value={content.ctaBehavior || 'add_to_cart'}
              onChange={(e) => onUpdate({ ctaBehavior: e.target.value as any })}
            >
              <option value="add_to_cart">Add to Cart</option>
              <option value="buy_now">Buy Now</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">CTA Text</Label>
            <Input
              value={content.ctaText || (content.ctaBehavior === 'buy_now' ? 'Buy Now' : 'Add to Cart')}
              onChange={(e) => onUpdate({ ctaText: e.target.value })}
              placeholder="Add to Cart"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ModernProductGridSave: React.FC<BlockSaveProps> = ({ block }) => {
  const content = block.content as ModernProductGridContent;
  const { store } = useStore();
  const { addItem, clearCart } = useCart();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [store?.id, content.limit]);

  const fetchProducts = async () => {
    if (!store?.id) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, compare_price, images, short_description')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .limit(content.limit || 8);

      if (error) throw error;
      setProducts((data || []).map(product => ({
        ...product,
        images: Array.isArray(product.images) ? product.images : [product.images].filter(Boolean)
      })));
    } catch (error) {
      console.error('Error fetching products:', error);
      // Use mock data for demo
      setProducts([
        {
          id: '1',
          name: 'Meta Quest 3 VR Headset',
          price: 499.99,
          compare_price: 599.99,
          images: ['/placeholder.svg'],
          short_description: 'Next-generation mixed reality headset'
        },
        {
          id: '2',
          name: 'PlayStation VR2',
          price: 549.99,
          images: ['/placeholder.svg'],
          short_description: 'Console VR gaming at its finest'
        },
        {
          id: '3',
          name: 'Pico 4 Enterprise',
          price: 899.99,
          compare_price: 999.99,
          images: ['/placeholder.svg'],
          short_description: 'Professional VR for business'
        },
        {
          id: '4',
          name: 'Valve Index Kit',
          price: 999.99,
          images: ['/placeholder.svg'],
          short_description: 'Premium PC VR experience'
        },
        {
          id: '5',
          name: 'HTC Vive Pro 2',
          price: 1399.99,
          images: ['/placeholder.svg'],
          short_description: 'High-resolution VR headset'
        },
        {
          id: '6',
          name: 'Apple Vision Pro',
          price: 3499.99,
          images: ['/placeholder.svg'],
          short_description: 'Revolutionary spatial computing'
        },
        {
          id: '7',
          name: 'Varjo Aero',
          price: 1990.99,
          images: ['/placeholder.svg'],
          short_description: 'Professional VR for creators'
        },
        {
          id: '8',
          name: 'PICO 4',
          price: 429.99,
          images: ['/placeholder.svg'],
          short_description: 'All-in-one VR headset'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getGridCols = () => {
    const cols = content.columns || 4;
    switch (cols) {
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      case 5: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5';
      case 6: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    }
  };

  const renderRating = (rating: number = 4.5) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
          <div className={`grid ${getGridCols()} gap-6`}>
            {Array.from({ length: content.limit || 8 }).map((_, i) => (
              <div key={i} className="bg-gray-200 h-80 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            {content.title || 'Featured VR Products'}
          </h2>
          {content.subtitle && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {content.subtitle}
            </p>
          )}
        </div>

        <div className={`grid ${getGridCols()} gap-6`}>
          {products.map((product, index) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="relative">
                <img
                  src={Array.isArray(product.images) ? product.images[0] : product.images || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                />
                
                {content.showWishlist !== false && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                )}

                {product.compare_price && (
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                    -{Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}%
                  </Badge>
                )}

                {content.showStock !== false && (
                  <Badge 
                    variant="secondary" 
                    className="absolute bottom-2 left-2 bg-green-100 text-green-800"
                  >
                    In Stock
                  </Badge>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {product.name}
                </h3>
                
                {product.short_description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.short_description}
                  </p>
                )}

                {content.showRating !== false && (
                  <div className="mb-3">
                    {renderRating(4.2 + (index * 0.1))}
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-orange-500">
                      {formatCurrency(product.price)}
                    </span>
                    {product.compare_price && (
                      <span className="text-lg text-gray-400 line-through">
                        {formatCurrency(product.compare_price)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  {content.showQuickAdd !== false && (
                    <Button 
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                      onClick={() => {
                        if (content.ctaBehavior === 'buy_now' && store?.slug) {
                          clearCart();
                          addItem({
                            id: `cart-${product.id}`,
                            productId: product.id,
                            name: product.name,
                            price: product.price,
                            image: Array.isArray(product.images) ? product.images[0] : (product as any).images,
                          });
                          window.location.href = `/store/${store.slug}/checkout`;
                        } else {
                          addItem({
                            id: `cart-${product.id}`,
                            productId: product.id,
                            name: product.name,
                            price: product.price,
                            image: Array.isArray(product.images) ? product.images[0] : (product as any).images,
                          });
                          toast({ title: 'Added to cart', description: `${product.name} has been added to your cart.` });
                        }
                      }}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {content.ctaText || (content.ctaBehavior === 'buy_now' ? 'Buy Now' : 'Add to Cart')}
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="px-8">
            View All Products
          </Button>
        </div>
      </div>
    </section>
  );
};

export const modernProductGridBlock: BlockRegistration = {
  name: 'modern_product_grid',
  settings: {
    name: 'modern_product_grid',
    title: 'Modern Product Grid',
    icon: Grid,
    category: 'store',
    supports: {
      alignment: true,
      spacing: true,
      color: true,
    },
  },
  edit: ModernProductGridEdit,
  save: ModernProductGridSave,
};