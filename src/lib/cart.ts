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

interface ProductVariation {
  [key: string]: string | number;
}

/**
 * Normalizes a product variation object for consistent comparison
 */
export const normalizeProductVariation = (variation: any): ProductVariation | null => {
  if (!variation || typeof variation !== 'object') {
    return null;
  }

  // Convert to a plain object and sort keys for consistent comparison
  const normalized: ProductVariation = {};
  Object.keys(variation)
    .sort()
    .forEach(key => {
      const value = variation[key];
      if (value !== null && value !== undefined && value !== '') {
        normalized[key] = String(value);
      }
    });

  return Object.keys(normalized).length > 0 ? normalized : null;
};

/**
 * Creates a stable variant key for cart item identification
 */
export const createVariantKey = (productId: string, variation?: any): string => {
  const normalizedVariation = normalizeProductVariation(variation);
  if (!normalizedVariation) {
    return productId;
  }

  const sortedEntries = Object.entries(normalizedVariation)
    .sort(([a], [b]) => a.localeCompare(b));
  
  const variationString = sortedEntries
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
  
  return `${productId}::${variationString}`;
};

/**
 * Creates a canonical cart item with consistent ID
 */
export const createCartItem = (item: Omit<CartItem, 'id'> & { id?: string }): CartItem => {
  const stableId = createVariantKey(item.productId, item.variation);
  
  return {
    ...item,
    id: stableId,
    variation: normalizeProductVariation(item.variation),
  };
};

/**
 * Merges cart items with the same product ID and variation
 */
export const mergeCartItems = (items: CartItem[]): CartItem[] => {
  const itemMap = new Map<string, CartItem>();

  for (const item of items) {
    const canonicalItem = createCartItem(item);
    const key = canonicalItem.id;

    if (itemMap.has(key)) {
      const existing = itemMap.get(key)!;
      itemMap.set(key, {
        ...existing,
        quantity: existing.quantity + canonicalItem.quantity,
      });
    } else {
      itemMap.set(key, canonicalItem);
    }
  }

  return Array.from(itemMap.values());
};

/**
 * Checks if two variations are equivalent
 */
export const areVariationsEqual = (variation1: any, variation2: any): boolean => {
  const normalized1 = normalizeProductVariation(variation1);
  const normalized2 = normalizeProductVariation(variation2);

  if (!normalized1 && !normalized2) return true;
  if (!normalized1 || !normalized2) return false;

  const keys1 = Object.keys(normalized1).sort();
  const keys2 = Object.keys(normalized2).sort();

  if (keys1.length !== keys2.length) return false;

  return keys1.every(key => normalized1[key] === normalized2[key]);
};