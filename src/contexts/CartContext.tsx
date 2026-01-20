import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { usePixelContext } from '@/components/pixel/PixelManager';
import { createCartItem, mergeCartItems } from '@/lib/cart';
import { useChannelContext } from '@/hooks/useChannelContext';
import { useCartDrawer } from '@/contexts/CartDrawerContext';

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
  discountCode: string;
  discountAmount: number;
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> & { quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }
  | { type: 'APPLY_DISCOUNT'; payload: { code: string; amount: number } }
  | { type: 'CLEAR_DISCOUNT' };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  discountCode: '',
  discountAmount: 0,
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
      return { 
        items: mergedItems, 
        total, 
        itemCount,
        discountCode: state.discountCode,
        discountAmount: state.discountAmount
      };
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      const { total, itemCount } = calculateTotals(newItems);
      return { 
        items: newItems, 
        total, 
        itemCount,
        discountCode: state.discountCode,
        discountAmount: state.discountAmount
      };
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
      return { 
        items: newItems, 
        total, 
        itemCount,
        discountCode: state.discountCode,
        discountAmount: state.discountAmount
      };
    }
    
    case 'CLEAR_CART':
      return initialState;
    
    case 'LOAD_CART': {
      const mergedItems = mergeCartItems(action.payload);
      const { total, itemCount } = calculateTotals(mergedItems);
      return { items: mergedItems, total, itemCount, discountCode: state.discountCode, discountAmount: state.discountAmount };
    }
    
    case 'APPLY_DISCOUNT': {
      return {
        ...state,
        discountCode: action.payload.code,
        discountAmount: action.payload.amount,
      };
    }
    
    case 'CLEAR_DISCOUNT': {
      return {
        ...state,
        discountCode: '',
        discountAmount: 0,
      };
    }
    
    default:
      return state;
  }
};

interface CartContextType extends CartState {
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }, skipOpenCart?: boolean) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyDiscount: (code: string, amount: number) => void;
  clearDiscount: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: React.ReactNode;
  storeId?: string;
  websiteIdOverride?: string;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children, storeId, websiteIdOverride }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [currentStoreId, setCurrentStoreId] = useState<string | undefined>(undefined);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const pixelContext = usePixelContext();
  const pixels = pixelContext?.pixels;
  const { websiteId: resolvedWebsiteId, funnelId: resolvedFunnelId } = useChannelContext();
  const cartDrawer = useCartDrawer();
  
  // ✅ FIX: Ensure storeId is available - fetch from website/funnel if not provided
  const [effectiveStoreId, setEffectiveStoreId] = useState<string | undefined>(storeId);
  
  useEffect(() => {
    if (storeId) {
      setEffectiveStoreId(storeId);
    } else if (resolvedWebsiteId) {
      // Fetch storeId from website
      supabase.from('websites').select('store_id').eq('id', resolvedWebsiteId).maybeSingle()
        .then(({ data }) => {
          if (data?.store_id) {
            setEffectiveStoreId(data.store_id);
          }
        })
        .catch((error) => {
          console.warn('[CartContext] Failed to fetch storeId from website:', error);
        });
    } else if (resolvedFunnelId) {
      // Fetch storeId from funnel
      supabase.from('funnels').select('store_id').eq('id', resolvedFunnelId).maybeSingle()
        .then(({ data }) => {
          if (data?.store_id) {
            setEffectiveStoreId(data.store_id);
          }
        })
        .catch((error) => {
          console.warn('[CartContext] Failed to fetch storeId from funnel:', error);
        });
    }
  }, [storeId, resolvedWebsiteId, resolvedFunnelId]);
  
  // Use websiteIdOverride if provided, otherwise fall back to resolved websiteId
  const effectiveWebsiteId = websiteIdOverride || resolvedWebsiteId;
  const { trackAddToCart } = usePixelTracking(pixels, effectiveStoreId, effectiveWebsiteId, resolvedFunnelId);

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
          const cartData = JSON.parse(savedCart);
          // Handle both old format (array of items) and new format (object with items and discount)
          if (Array.isArray(cartData)) {
            // Old format - just items
            dispatch({ type: 'LOAD_CART', payload: cartData });
          } else {
            // New format - items and discount
            dispatch({ type: 'LOAD_CART', payload: cartData.items || [] });
            if (cartData.discountCode && cartData.discountAmount) {
              dispatch({ type: 'APPLY_DISCOUNT', payload: { code: cartData.discountCode, amount: cartData.discountAmount } });
            }
          }
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
          const cartData = JSON.parse(savedCart);
          // Handle both old format (array of items) and new format (object with items and discount)
          if (Array.isArray(cartData)) {
            // Old format - just items
            dispatch({ type: 'LOAD_CART', payload: cartData });
          } else {
            // New format - items and discount
            dispatch({ type: 'LOAD_CART', payload: cartData.items || [] });
            if (cartData.discountCode && cartData.discountAmount) {
              dispatch({ type: 'APPLY_DISCOUNT', payload: { code: cartData.discountCode, amount: cartData.discountAmount } });
            }
          }
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
  // BUT: Don't save if cart is empty (to prevent reloading empty cart after clearCart)
  useEffect(() => {
    const cartKey = getCartKey(storeId);
    
    // Only save if cart has items OR if there's a discount code (to preserve discount)
    // If cart is empty and no discount, remove from localStorage instead
    if (state.items.length === 0 && !state.discountCode) {
      // Cart is empty and no discount - remove from localStorage
      localStorage.removeItem(cartKey);
    } else {
      // Cart has items or discount - save to localStorage
      const cartData = {
        items: state.items,
        discountCode: state.discountCode,
        discountAmount: state.discountAmount,
      };
      localStorage.setItem(cartKey, JSON.stringify(cartData));
    }
  }, [state.items, state.discountCode, state.discountAmount, storeId]);

  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }, skipOpenCart?: boolean) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
    
    // ✅ FIX: Always track add to cart event (trackAddToCart handles missing pixels internally)
    try {
      trackAddToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        variant: item.variation ? JSON.stringify(item.variation) : undefined,
      });
    } catch (error) {
      console.warn('Failed to track add to cart event:', error);
    }

    // Auto-open cart drawer when item is added (unless skipOpenCart is true)
    if (!skipOpenCart && cartDrawer?.openCart) {
      cartDrawer.openCart();
    }
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    // Clear from localStorage FIRST to prevent race condition
    const cartKey = getCartKey(storeId);
    localStorage.removeItem(cartKey);
    
    // Also clear all possible cart keys as backup
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cart_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Then dispatch CLEAR_CART to update state
    // The save useEffect will see empty cart and won't save (due to our check above)
    dispatch({ type: 'CLEAR_CART' });
  };

  const applyDiscount = (code: string, amount: number) => {
    dispatch({ type: 'APPLY_DISCOUNT', payload: { code, amount } });
  };

  const clearDiscount = () => {
    dispatch({ type: 'CLEAR_DISCOUNT' });
  };

  return (
    <CartContext.Provider value={{
      ...state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      applyDiscount,
      clearDiscount,
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