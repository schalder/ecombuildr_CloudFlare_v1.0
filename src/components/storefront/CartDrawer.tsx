import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { useStore } from '@/contexts/StoreContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useEcomPaths } from '@/lib/pathResolver';
import { CartTableRow } from './CartTableRow';
import { CartTotalsSidebar } from './CartTotalsSidebar';
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
      <SheetContent className="w-full sm:w-[800px] lg:w-[1000px] xl:w-[1200px] flex flex-col">
        <SheetHeader className="flex-shrink-0 pb-4">
          <SheetTitle className="text-xl font-semibold">
            Shopping Cart
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
          {items.length === 0 ? (
            <div className="flex-1">
              <CartEmptyState onContinueShopping={paths.products} />
            </div>
          ) : (
            <>
              {/* Cart Table */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="min-w-full">
                  <table className="w-full">
                    <thead className="border-b border-border/40">
                      <tr>
                        <th className="text-left py-3 pr-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          Product
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          Price
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          Quantity
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          Subtotal
                        </th>
                        <th className="py-3 pl-4 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <CartTableRow
                          key={item.id}
                          item={item}
                          onUpdateQuantity={updateQuantity}
                          onRemove={handleRemoveItem}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary Sidebar */}
              <div className="flex-shrink-0">
                <CartTotalsSidebar
                  subtotal={total}
                  total={total}
                  itemCount={items.reduce((sum, item) => sum + item.quantity, 0)}
                  checkoutPath={paths.checkout}
                />
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};