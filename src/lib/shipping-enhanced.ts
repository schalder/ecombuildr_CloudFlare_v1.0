// Enhanced shipping calculation with product-specific and weight-based shipping
export type ShippingCityRule = {
  city: string;
  fee: number;
  label?: string;
};

export type ShippingAreaRule = {
  area: string;
  fee: number;
  label?: string;
};

export type ShippingWeightTier = {
  maxWeight: number; // in grams (internally stored)
  fee: number;
  label?: string;
};

export type ShippingSettings = {
  enabled: boolean;
  country?: string;
  restOfCountryFee: number;
  cityRules: ShippingCityRule[];
  areaRules?: ShippingAreaRule[];
  // Enhanced settings
  weightTiers?: ShippingWeightTier[];
  freeShippingThreshold?: number; // minimum order amount for free shipping
  freeShippingMinWeight?: number; // minimum weight for free shipping (in grams)
};

export type CustomShippingOption = {
  id: string;
  label: string;
  fee: number;
  description?: string;
  isDefault?: boolean;
};

export type ProductShippingConfig = {
  type: 'default' | 'fixed' | 'weight_surcharge' | 'free' | 'custom_options';
  fixedFee?: number;
  weightSurcharge?: number; // per gram
  freeShippingEnabled?: boolean;
  customOptions?: CustomShippingOption[];
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  weight_grams?: number;
  shipping_config?: ProductShippingConfig;
};

export type ShippingAddress = {
  city?: string;
  area?: string;
  address?: string;
  postal?: string;
};

function normalize(str?: string) {
  return (str || '').trim().toLowerCase();
}

/**
 * Calculate base shipping fee based on address and website shipping settings
 * Priority: Zone/Area > City > Default
 */
function calculateBaseShippingFee(
  settings: ShippingSettings,
  address: ShippingAddress
): number {
  const city = normalize(address.city);
  const area = normalize(address.area);
  const addressText = normalize(address.address);

  // 1) Check area/zone rules first (highest priority)
  if (area && settings.areaRules && settings.areaRules.length > 0) {
    const areaMatch = settings.areaRules.find((r) => normalize(r.area) === area);
    if (areaMatch) return Number(areaMatch.fee) || 0;
  }

  // 2) Exact city match (second priority)
  if (city) {
    const cityMatch = settings.cityRules.find((r) => normalize(r.city) === city);
    if (cityMatch) return Number(cityMatch.fee) || 0;
  }

  // 3) Fallback: substring match of rule city within area or address
  const haystacks = [area, addressText].filter(Boolean) as string[];
  if (haystacks.length) {
    const found = settings.cityRules.find((r) => {
      const ruleCity = normalize(r.city);
      return ruleCity && haystacks.some((h) => h.includes(ruleCity));
    });
    if (found) return Number(found.fee) || 0;
  }

  // 4) Rest of country fallback (lowest priority)
  return Number(settings.restOfCountryFee) || 0;
}

/**
 * Calculate weight-based shipping fee
 */
function calculateWeightBasedFee(
  settings: ShippingSettings,
  totalWeight: number
): number {
  if (!settings.weightTiers || settings.weightTiers.length === 0) {
    return 0;
  }

  // Find the appropriate weight tier
  const sortedTiers = [...settings.weightTiers].sort((a, b) => a.maxWeight - b.maxWeight);
  
  for (const tier of sortedTiers) {
    if (totalWeight <= tier.maxWeight) {
      return Number(tier.fee) || 0;
    }
  }

  // If weight exceeds all tiers, use the highest tier fee
  return Number(sortedTiers[sortedTiers.length - 1].fee) || 0;
}

/**
 * Calculate shipping cost for an entire order with product-specific shipping
 */
export function computeOrderShipping(
  websiteShipping: ShippingSettings | undefined,
  items: CartItem[],
  address: ShippingAddress,
  subtotal: number = 0
): {
  shippingCost: number;
  isFreeShipping: boolean;
  breakdown: {
    baseFee: number;
    weightFee: number;
    productSpecificFees: number;
    totalBeforeDiscount: number;
    discount: number;
  };
} {
  if (!websiteShipping || !websiteShipping.enabled) {
    return {
      shippingCost: 0,
      isFreeShipping: true,
      breakdown: {
        baseFee: 0,
        weightFee: 0,
        productSpecificFees: 0,
        totalBeforeDiscount: 0,
        discount: 0,
      },
    };
  }

  let baseFee = 0;
  let weightFee = 0;
  let productSpecificFees = 0;
  let totalWeight = 0;
  let hasAnyFreeShippingProduct = false;

  // Calculate total weight and check for free shipping products
  for (const item of items) {
    totalWeight += (item.weight_grams || 0) * item.quantity;
    
    if (item.shipping_config?.freeShippingEnabled || item.shipping_config?.type === 'free') {
      hasAnyFreeShippingProduct = true;
    }
  }

  // 1. Calculate base shipping fee (location-based)
  baseFee = calculateBaseShippingFee(websiteShipping, address);

  // 2. Calculate weight-based fee
  if (websiteShipping.weightTiers && totalWeight > 0) {
    weightFee = calculateWeightBasedFee(websiteShipping, totalWeight);
  }

  // 3. Calculate product-specific fees
  for (const item of items) {
    const config = item.shipping_config;
    if (!config || config.type === 'default') continue;

    switch (config.type) {
      case 'fixed':
        productSpecificFees += (config.fixedFee || 0) * item.quantity;
        break;
      case 'weight_surcharge':
        const itemWeight = (item.weight_grams || 0) * item.quantity;
        productSpecificFees += itemWeight * (config.weightSurcharge || 0);
        break;
      case 'free':
        // Free shipping products don't add to shipping cost
        break;
    }
  }

  const totalBeforeDiscount = baseFee + weightFee + productSpecificFees;

  // 4. Apply free shipping rules
  let isFreeShipping = false;
  let discount = 0;

  // Free shipping if any product has free shipping enabled
  if (hasAnyFreeShippingProduct) {
    isFreeShipping = true;
    discount = totalBeforeDiscount;
  }
  // Free shipping based on order threshold
  else if (websiteShipping.freeShippingThreshold && subtotal >= websiteShipping.freeShippingThreshold) {
    isFreeShipping = true;
    discount = totalBeforeDiscount;
  }
  // Free shipping based on weight threshold
  else if (websiteShipping.freeShippingMinWeight && totalWeight >= websiteShipping.freeShippingMinWeight) {
    isFreeShipping = true;
    discount = totalBeforeDiscount;
  }

  const shippingCost = Math.max(0, totalBeforeDiscount - discount);

  return {
    shippingCost,
    isFreeShipping,
    breakdown: {
      baseFee,
      weightFee,
      productSpecificFees,
      totalBeforeDiscount,
      discount,
    },
  };
}

// Legacy function for backward compatibility
export function computeShippingForAddress(
  settings: ShippingSettings | undefined,
  address: ShippingAddress
): number | undefined {
  if (!settings || !settings.enabled) return undefined;
  return calculateBaseShippingFee(settings, address);
}