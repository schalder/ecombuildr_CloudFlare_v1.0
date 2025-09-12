import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { usePixelContext } from '@/components/pixel/PixelManager';
import { createCartItem, mergeCartItems } from '@/lib/cart';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
  variation?: any;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> & { quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
};

const calculateTotals = (items: CartItem[]): { total: number; itemCount: number } => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { total, itemCount };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const newItem = createCartItem({
        ...action.payload,
        quantity: action.payload.quantity || 1,
      });
      
      // Add to existing items and merge duplicates
      const allItems = [...state.items, newItem];
      const mergedItems = mergeCartItems(allItems);
      
      const { total, itemCount } = calculateTotals(mergedItems);
      return { items: mergedItems, total, itemCount };
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      const { total, itemCount } = calculateTotals(newItems);
      return { items: newItems, total, itemCount };
    }
    
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: action.payload.id });
      }
      
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      
      const { total, itemCount } = calculateTotals(newItems);
      return { items: newItems, total, itemCount };
    }
    
    case 'CLEAR_CART':
      return initialState;
    
    case 'LOAD_CART': {
      const mergedItems = mergeCartItems(action.payload);
      const { total, itemCount } = calculateTotals(mergedItems);
      return { items: mergedItems, total, itemCount };
    }
    
    default:
      return state;
  }
};

interface CartContextType extends CartState {
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: React.ReactNode;
  storeId?: string;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children, storeId }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [currentStoreId, setCurrentStoreId] = useState<string | undefined>(undefined);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const pixelContext = usePixelContext();
  const pixels = pixelContext?.pixels;
  const { trackAddToCart } = usePixelTracking(pixels);

  // Create store-specific cart key
  const getCartKey = (id?: string) => id ? `cart_${id}` : 'cart_global';

  // Load cart from localStorage on mount or store change
  useEffect(() => {
    const cartKey = getCartKey(storeId);
    const savedCart = localStorage.getItem(cartKey);
    
    // Handle initial load
    if (isInitialLoad) {
      setIsInitialLoad(false);
      setCurrentStoreId(storeId);
      
      if (savedCart) {
        try {
          const cartItems = JSON.parse(savedCart);
          dispatch({ type: 'LOAD_CART', payload: cartItems });
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
          dispatch({ type: 'CLEAR_CART' });
        }
      }
      return;
    }
    
    // Handle store changes (not initial load)
    if (currentStoreId !== storeId) {
      setCurrentStoreId(storeId);
      
      if (savedCart) {
        try {
          const cartItems = JSON.parse(savedCart);
          dispatch({ type: 'LOAD_CART', payload: cartItems });
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
          dispatch({ type: 'CLEAR_CART' });
        }
      } else {
        dispatch({ type: 'CLEAR_CART' });
      }
    }
  }, [storeId, currentStoreId, isInitialLoad]);

  // Save cart to localStorage whenever it changes (store-specific)
  useEffect(() => {
    const cartKey = getCartKey(storeId);
    localStorage.setItem(cartKey, JSON.stringify(state.items));
  }, [state.items, storeId]);

  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
    
    // Track add to cart event (only if pixels are available)
    try {
      if (pixels) {
        trackAddToCart({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          variant: item.variation ? JSON.stringify(item.variation) : undefined,
        });
      }
    } catch (error) {
      console.warn('Failed to track add to cart event:', error);
    }
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{
      ...state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};