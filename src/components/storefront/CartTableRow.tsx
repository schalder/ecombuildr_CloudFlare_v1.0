import React from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';

interface CartTableRowProps {
  item: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    variation?: any;
  };
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export const CartTableRow: React.FC<CartTableRowProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, item.quantity + delta);
    onUpdateQuantity(item.id, newQuantity);
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
    <tr className="border-b border-border/40 hover:bg-muted/30 transition-colors">
      {/* Product Column */}
      <td className="py-4 pr-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg border border-border/40"
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded-lg border border-border/40 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">No image</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate">
              {item.name}
            </h4>
            {renderVariationChips()}
          </div>
        </div>
      </td>

      {/* Price Column */}
      <td className="py-4 px-4 text-sm text-foreground">
        {formatCurrency(item.price)}
      </td>

      {/* Quantity Column */}
      <td className="py-4 px-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0 hover:bg-muted"
            onClick={() => handleQuantityChange(-1)}
            disabled={item.quantity <= 1}
          >
            <Minus className="w-3 h-3" />
          </Button>
          
          <span className="min-w-[2rem] text-center text-sm font-medium">
            {item.quantity}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0 hover:bg-muted"
            onClick={() => handleQuantityChange(1)}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </td>

      {/* Subtotal Column */}
      <td className="py-4 px-4 text-sm font-medium text-foreground">
        {formatCurrency(item.price * item.quantity)}
      </td>

      {/* Remove Column */}
      <td className="py-4 pl-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(item.id)}
        >
          <X className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
};