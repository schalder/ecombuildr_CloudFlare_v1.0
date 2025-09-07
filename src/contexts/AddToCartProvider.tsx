import React, { createContext, useContext, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { ProductQuickView } from '@/components/storefront/ProductQuickView';
import { useNavigate, useLocation } from 'react-router-dom';
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
  addToCart: (product: Product, quantity?: number, buyNow?: boolean, selectedOptions?: any) => void;
  openQuickView: (product: Product) => void;
  isQuickViewOpen: boolean;
  closeQuickView: () => void;
}

const AddToCartContext = createContext<AddToCartContextType | undefined>(undefined);

export const AddToCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addItem, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const paths = useEcomPaths();
  
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [pendingBuyNow, setPendingBuyNow] = useState(false);

  const hasVariations = (product: Product) => {
    if (!product.variations) return false;
    
    // Handle array format: [{ name: "Size", options: ["S", "M", "L"] }]
    if (Array.isArray(product.variations)) {
      return product.variations.length > 0 && 
        product.variations.some((v: any) => v.options && v.options.length > 0);
    }
    
    // Handle object format: { options: [...], variants: [...] }
    if (typeof product.variations === 'object') {
      return product.variations.options && 
        Array.isArray(product.variations.options) && 
        product.variations.options.length > 0;
    }
    
    return false;
  };

  const addToCart = (product: Product, quantity: number = 1, buyNow: boolean = false, selectedOptions?: any) => {
    // Only show dialog if product has variations AND no options are pre-selected
    if (hasVariations(product) && !selectedOptions) {
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
        variation: selectedOptions,
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

  const handleQuickViewAddToCart = (product: Product, quantity: number, selectedOptions?: any) => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images?.[0],
      variation: selectedOptions,
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