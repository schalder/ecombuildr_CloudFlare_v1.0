import React from 'react';
import { useLocation } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CartDrawer } from './CartDrawer';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

interface FloatingCartButtonProps {
  position?: 'bottom-right' | 'bottom-left';
  color?: string;
}

export const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({ 
  position = 'bottom-right',
  color
}) => {
  const { itemCount } = useCart();
  const location = useLocation();

  // Hide on cart and checkout pages to avoid redundancy
  const hiddenRoutes = ['/cart', '/checkout'];
  const shouldHide = hiddenRoutes.some(route => location.pathname.endsWith(route));

  if (shouldHide) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-24 right-6',
    'bottom-left': 'bottom-24 left-6'
  };

  return (
    <CartDrawer trigger>
      <div
        className={cn(
          'fixed z-[100] transition-all duration-300 hover:scale-105',
          positionClasses[position]
        )}
      >
        <Button
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg relative p-0 transition-all duration-300 hover:scale-105",
            !color && "bg-primary hover:bg-primary/90"
          )}
          style={color ? {
            backgroundColor: color,
            borderColor: color,
          } : undefined}
          aria-label={`Open cart (${itemCount} items)`}
        >
          <ShoppingCart className="h-6 w-6" />
          {itemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center text-xs min-w-[1.5rem] rounded-full"
            >
              {itemCount > 99 ? '99+' : itemCount}
            </Badge>
          )}
        </Button>
      </div>
    </CartDrawer>
  );
};