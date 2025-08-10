import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { GitCompare, X, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  images: string[];
  slug: string;
  short_description?: string;
}

interface ProductComparisonProps {
  storeSlug: string;
  onAddToCart: (product: Product) => void;
}

export const ProductComparison: React.FC<ProductComparisonProps> = ({
  storeSlug,
  onAddToCart
}) => {
  const [compareProducts, setCompareProducts] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load comparison products from localStorage
    const comparison = localStorage.getItem(`comparison-${storeSlug}`);
    if (comparison) {
      try {
        const products = JSON.parse(comparison);
        setCompareProducts(products);
      } catch (error) {
        console.error('Error parsing comparison products:', error);
      }
    }
  }, [storeSlug]);

  const addToComparison = (product: Product) => {
    const comparison = localStorage.getItem(`comparison-${storeSlug}`);
    let products: Product[] = [];
    
    if (comparison) {
      try {
        products = JSON.parse(comparison);
      } catch (error) {
        console.error('Error parsing comparison products:', error);
      }
    }

    // Check if already in comparison
    if (products.some(p => p.id === product.id)) {
      return false;
    }

    // Limit to 3 products for comparison
    if (products.length >= 3) {
      return false;
    }

    products.push(product);
    localStorage.setItem(`comparison-${storeSlug}`, JSON.stringify(products));
    setCompareProducts(products);
    return true;
  };

  const removeFromComparison = (productId: string) => {
    const updatedProducts = compareProducts.filter(p => p.id !== productId);
    localStorage.setItem(`comparison-${storeSlug}`, JSON.stringify(updatedProducts));
    setCompareProducts(updatedProducts);
  };

  const clearComparison = () => {
    localStorage.removeItem(`comparison-${storeSlug}`);
    setCompareProducts([]);
  };

  // Expose function globally
  useEffect(() => {
    (window as any).addToComparison = addToComparison;
  }, []);

  if (compareProducts.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="fixed bottom-4 right-4 z-50 shadow-lg bg-background border-2 border-primary hover:bg-primary hover:text-primary-foreground"
        >
          <GitCompare className="h-4 w-4 mr-2" />
          Compare ({compareProducts.length})
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Product Comparison</DialogTitle>
            <Button variant="ghost" size="sm" onClick={clearComparison}>
              Clear All
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {compareProducts.map((product) => (
            <Card key={product.id} className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10 h-8 w-8 p-0"
                onClick={() => removeFromComparison(product.id)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="aspect-square relative bg-muted">
                <img
                  src={product.images[0] || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                  {product.name}
                </h3>
                
                {product.short_description && (
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {product.short_description}
                  </p>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">
                      {formatCurrency(product.price)}
                    </span>
                    {product.compare_price && product.compare_price > product.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(product.compare_price)}
                      </span>
                    )}
                  </div>
                  
                  {product.compare_price && product.compare_price > product.price && (
                    <Badge variant="destructive" className="text-xs">
                      {Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}% OFF
                    </Badge>
                  )}
                </div>
                
                <Button
                  onClick={() => onAddToCart(product)}
                  className="w-full"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};