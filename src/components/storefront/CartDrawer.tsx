import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { useStore } from '@/contexts/StoreContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useEcomPaths } from '@/lib/pathResolver';
import { CartItemCard } from './CartItemCard';
import { CartOrderSummary } from './CartOrderSummary';
import { CartEmptyState } from './CartEmptyState';
import { useToast } from '@/hooks/use-toast';

interface CartDrawerProps {
  children: React.ReactNode;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ children }) => {
  const { items, total, updateQuantity, removeItem } = useCart();
  const { store } = useStore();
  const paths = useEcomPaths();
  const { toast } = useToast();

  if (!store) return null;

  const handleSaveForLater = (item: any) => {
    toast({
      title: "Saved for later",
      description: `${item.name} has been saved to your wishlist.`,
    });
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart.",
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[420px] lg:w-[500px] flex flex-col">
        <SheetHeader className="flex-shrink-0 pb-4">
          <SheetTitle className="text-xl font-semibold">
            Shopping Cart
            {items.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({items.length} {items.length === 1 ? 'item' : 'items'})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 overflow-y-auto min-h-0">
            {items.length === 0 ? (
              <CartEmptyState onContinueShopping={paths.products} />
            ) : (
              <div className="space-y-4 pb-4">
                {items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={handleRemoveItem}
                    onSaveForLater={handleSaveForLater}
                  />
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur-sm pt-4">
              <CartOrderSummary
                subtotal={total}
                total={total}
                itemCount={items.reduce((sum, item) => sum + item.quantity, 0)}
                checkoutPath={paths.checkout}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};