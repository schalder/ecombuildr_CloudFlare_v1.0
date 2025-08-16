import React, { createContext, useContext, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { ProductQuickView } from '@/components/storefront/ProductQuickView';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useEcomPaths } from '@/lib/pathResolver';

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  short_description?: string;
  description?: string;
  images: any[];
  slug: string;
  is_active: boolean;
  variations?: any;
  track_inventory?: boolean;
  inventory_quantity?: number;
}

interface AddToCartContextType {
  addToCart: (product: Product, quantity?: number, buyNow?: boolean) => void;
  openQuickView: (product: Product) => void;
  isQuickViewOpen: boolean;
  closeQuickView: () => void;
}

const AddToCartContext = createContext<AddToCartContextType | undefined>(undefined);

export const AddToCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addItem, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const paths = useEcomPaths();
  
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [pendingBuyNow, setPendingBuyNow] = useState(false);

  const hasVariations = (product: Product) => {
    return product.variations && 
      Array.isArray(product.variations) && 
      product.variations.length > 0 &&
      product.variations.some((v: any) => v.options && v.options.length > 0);
  };

  const addToCart = (product: Product, quantity: number = 1, buyNow: boolean = false) => {
    if (hasVariations(product)) {
      // Open quick view for variant selection
      setQuickViewProduct(product);
      setPendingBuyNow(buyNow);
    } else {
      // For buy now, clear cart first
      if (buyNow) {
        clearCart();
      }

      // Add directly to cart
      addItem({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.images?.[0],
        variation: null,
      });

      toast({
        title: buyNow ? 'Proceeding to checkout' : 'Added to cart',
        description: buyNow 
          ? `${product.name} added. Taking you to checkout...`
          : `${product.name} has been added to your cart.`,
      });

      if (buyNow) {
        navigate(paths.checkout);
      }
    }
  };

  const openQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setPendingBuyNow(false);
  };

  const handleQuickViewAddToCart = (product: Product, selectedOptions: any, quantity: number) => {
    // For buy now, clear cart first
    if (pendingBuyNow) {
      clearCart();
    }

    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images?.[0],
      variation: selectedOptions,
    });

    toast({
      title: pendingBuyNow ? 'Proceeding to checkout' : 'Added to cart',
      description: pendingBuyNow 
        ? `${product.name} added. Taking you to checkout...`
        : `${product.name} has been added to your cart.`,
    });

    if (pendingBuyNow) {
      navigate(paths.checkout);
      setPendingBuyNow(false);
    }

    closeQuickView();
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
    setPendingBuyNow(false);
  };

  return (
    <AddToCartContext.Provider value={{
      addToCart,
      openQuickView,
      isQuickViewOpen: !!quickViewProduct,
      closeQuickView,
    }}>
      {children}
      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          isOpen={true}
          onClose={closeQuickView}
          onAddToCart={handleQuickViewAddToCart}
          storeSlug=""
        />
      )}
    </AddToCartContext.Provider>
  );
};

export const useAddToCart = () => {
  const context = useContext(AddToCartContext);
  if (context === undefined) {
    throw new Error('useAddToCart must be used within an AddToCartProvider');
  }
  return context;
};