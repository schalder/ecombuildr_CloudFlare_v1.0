import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Trash2, Heart } from 'lucide-react';
import { CartItem } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/currency';
import { nameWithVariant } from '@/lib/utils';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onSaveForLater?: (item: CartItem) => void;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  onSaveForLater
}) => {
  const handleQuantityChange = (delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0) {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  const renderVariationChips = () => {
    if (!item.variation) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(item.variation).map(([key, value]) => (
          <Badge key={key} variant="secondary" className="text-xs px-2 py-0.5">
            {key}: {String(value)}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="group relative bg-card border border-border rounded-lg p-4 transition-all duration-200 hover:shadow-md hover:border-primary/20">
      {/* Product Image */}
      <div className="flex gap-4">
        {item.image && (
          <div className="flex-shrink-0 relative">
            <div className="w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </div>
          </div>
        )}

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-sm leading-tight mb-1 break-words">
                {nameWithVariant(item.name, item.variation)}
              </h3>
              
              {renderVariationChips()}
              
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-medium text-foreground">
                  {formatCurrency(item.price)}
                </span>
                {item.sku && (
                  <span className="text-xs text-muted-foreground">
                    SKU: {item.sku}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {onSaveForLater && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSaveForLater(item)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                >
                  <Heart className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(item.id)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Quantity and Price Controls */}
          <div className="flex items-center justify-between mt-3">
            {/* Quantity Selector */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(-1)}
                disabled={item.quantity <= 1}
                className="h-8 w-8 p-0 rounded-full border-2 hover:border-primary/50 transition-colors"
              >
                <Minus className="h-3 w-3" />
              </Button>
              
              <div className="flex items-center justify-center min-w-[3rem] h-8 px-3 bg-muted rounded-md">
                <span className="text-sm font-medium">{item.quantity}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(1)}
                className="h-8 w-8 p-0 rounded-full border-2 hover:border-primary/50 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Item Total */}
            <div className="text-right">
              <div className="text-lg font-semibold text-foreground">
                {formatCurrency(item.price * item.quantity)}
              </div>
              {item.quantity > 1 && (
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(item.price)} each
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};