import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Heart, Star, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  short_description?: string;
  description?: string;
  images: string[];
  slug: string;
  is_active: boolean;
}

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, variation?: any) => void;
  storeSlug: string;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  storeSlug
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Black');
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!product) return null;

  const discountPercentage = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Navy', value: '#1E40AF' },
    { name: 'Gray', value: '#6B7280' },
  ];

  const handleAddToCart = () => {
    onAddToCart(product, quantity, {
      size: selectedSize,
      color: selectedColor
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Image Gallery */}
          <div className="relative">
            <div className="aspect-square bg-muted relative overflow-hidden">
              <img
                src={product.images[selectedImage] || product.images[0] || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {discountPercentage > 0 && (
                  <Badge variant="destructive" className="text-xs font-bold">
                    -{discountPercentage}% OFF
                  </Badge>
                )}
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-xs font-bold">
                  New Arrival
                </Badge>
              </div>

              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full bg-background/80 backdrop-blur-sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors",
                      selectedImage === index ? "border-primary" : "border-transparent"
                    )}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="p-6 space-y-6">
            <div>
              {/* Product Rating */}
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < 4 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                    )}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-2">(24 Reviews)</span>
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-2">{product.name}</h1>
              
              {/* Pricing */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold text-foreground">
                  {formatCurrency(product.price)}
                </span>
                {product.compare_price && product.compare_price > product.price && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatCurrency(product.compare_price)}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-sm text-emerald-600 font-medium">In Stock (47 items)</span>
              </div>
            </div>

            <Separator />

            {/* Product Description */}
            <div>
              <p className="text-muted-foreground leading-relaxed">
                {product.short_description || product.description}
              </p>
            </div>

            <Separator />

            {/* Size Selection */}
            <div>
              <h3 className="font-semibold mb-3">Size</h3>
              <div className="flex gap-2">
                {sizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSize(size)}
                    className="min-w-[40px]"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <h3 className="font-semibold mb-3">Color: {selectedColor}</h3>
              <div className="flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      selectedColor === color.name ? "border-primary scale-110" : "border-muted"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <Separator />

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Quantity</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-10 w-10 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-10 w-10 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Total: {formatCurrency(product.price * quantity)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleAddToCart}
                  className="flex-1 h-12 text-base font-semibold"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="h-12 w-12 p-0"
                >
                  <Heart className={cn("h-5 w-5", isWishlisted && "fill-red-500 text-red-500")} />
                </Button>
              </div>
            </div>

            {/* Product Features */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Free Shipping</span>
                    <p className="text-muted-foreground">On orders over {formatCurrency(1000)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Easy Returns</span>
                    <p className="text-muted-foreground">30-day return policy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};