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
  isQuickViewOpen: boolean;
  closeQuickView: () => void;
}

const AddToCartContext = createContext<AddToCartContextType | undefined>(undefined);

export const AddToCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const paths = useEcomPaths();
  
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [pendingBuyNow, setPendingBuyNow] = useState(false);

  const addToCart = (product: Product, quantity: number = 1, buyNow: boolean = false) => {
    // Check if product has variations that need selection
    const hasVariations = product.variations && 
      Array.isArray(product.variations) && 
      product.variations.length > 0 &&
      product.variations.some((v: any) => v.options && v.options.length > 0);

    if (hasVariations) {
      // Open quick view for variant selection
      setQuickViewProduct(product);
      setPendingBuyNow(buyNow);
    } else {
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
        title: 'Added to cart',
        description: `${product.name} has been added to your cart.`,
      });

      if (buyNow) {
        navigate(paths.cart);
      }
    }
  };

  const handleQuickViewAddToCart = (product: Product, selectedOptions: any, quantity: number) => {
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
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });

    if (pendingBuyNow) {
      navigate(paths.cart);
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