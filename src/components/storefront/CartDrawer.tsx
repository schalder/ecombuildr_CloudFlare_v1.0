import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEcomPaths } from '@/lib/pathResolver';
import { formatCurrency } from '@/lib/currency';
import { nameWithVariant } from '@/lib/utils';

interface CartDrawerProps {
  children: React.ReactNode;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ children }) => {
  const { items, total, updateQuantity, removeItem } = useCart();
  const { store } = useStore();
  const paths = useEcomPaths();

  if (!store) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] lg:w-[480px] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Shopping Cart ({items.length})</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 overflow-y-auto py-4 min-h-0">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">Your cart is empty</p>
                <Link to={paths.products}>
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 border rounded-lg bg-background">
                    {item.image && (
                      <div className="flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded border"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm leading-tight mb-1 break-words">{nameWithVariant(item.name, item.variation)}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{formatCurrency(item.price)} each</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium min-w-[2rem] text-center px-2">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-destructive h-7 w-7 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="flex-shrink-0 border-t pt-4 space-y-4 bg-background">
              <Separator className="mb-4" />
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items):</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              <Link to={paths.checkout} className="block">
                <Button className="w-full" size="lg">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};