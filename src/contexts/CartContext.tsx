import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { usePixelContext } from '@/components/pixel/PixelManager';

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

const stableVariantKey = (variation?: any): string => {
  if (!variation) return '';
  try {
    const source = (variation && typeof variation === 'object' && !Array.isArray(variation) && variation.options)
      ? variation.options
      : variation;
    
    if (source && typeof source === 'object' && !Array.isArray(source)) {
      const entries = Object.entries(source)
        .filter(([_, v]) => v !== undefined && v !== null && v !== '')
        .sort(([a], [b]) => a.localeCompare(b)); // Sort for consistency
      return entries.map(([k, v]) => `${k}:${String(v)}`).join('|');
    }
    if (Array.isArray(source)) {
      return source.sort().join('|');
    }
    return String(source);
  } catch {
    return '';
  }
};

const generateStableItemId = (productId: string, variation?: any): string => {
  const variantKey = stableVariantKey(variation);
  return variantKey ? `${productId}__${variantKey}` : productId;
};

const calculateTotals = (items: CartItem[]): { total: number; itemCount: number } => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { total, itemCount };
};

const deduplicateCartItems = (items: CartItem[]): CartItem[] => {
  const itemMap = new Map<string, CartItem>();
  
  items.forEach(item => {
    const stableId = generateStableItemId(item.productId, item.variation);
    const existing = itemMap.get(stableId);
    
    if (existing) {
      // Merge quantities
      itemMap.set(stableId, {
        ...existing,
        quantity: existing.quantity + item.quantity
      });
    } else {
      // Use stable ID for consistency
      itemMap.set(stableId, {
        ...item,
        id: stableId
      });
    }
  });
  
  return Array.from(itemMap.values());
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Generate stable ID based on productId and variation
      const stableId = generateStableItemId(action.payload.productId, action.payload.variation);
      const existingItem = state.items.find(item => item.id === stableId);
      let newItems: CartItem[];
      
      if (existingItem) {
        // Update existing item quantity
        newItems = state.items.map(item =>
          item.id === stableId
            ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
            : item
        );
      } else {
        // Add new item with stable ID
        newItems = [...state.items, { 
          ...action.payload, 
          id: stableId,
          quantity: action.payload.quantity || 1 
        }];
      }
      
      const { total, itemCount } = calculateTotals(newItems);
      return { items: newItems, total, itemCount };
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
      const deduplicatedItems = deduplicateCartItems(action.payload);
      const { total, itemCount } = calculateTotals(deduplicatedItems);
      return { items: deduplicatedItems, total, itemCount };
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

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const pixelContext = usePixelContext();
  const pixels = pixelContext?.pixels;
  const { trackAddToCart } = usePixelTracking(pixels);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartItems });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

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