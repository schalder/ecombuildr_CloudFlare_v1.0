import React, { createContext, useContext, useState } from 'react';

interface CartDrawerContextType {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextType | undefined>(undefined);

export const CartDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  return (
    <CartDrawerContext.Provider value={{ isOpen, openCart, closeCart }}>
      {children}
    </CartDrawerContext.Provider>
  );
};

export const useCartDrawer = () => {
  const context = useContext(CartDrawerContext);
  if (context === undefined) {
    throw new Error('useCartDrawer must be used within a CartDrawerProvider');
  }
  return context;
};