/**
 * Utilities for calculating upfront and delivery payments for COD products with upfront shipping
 */

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product_type?: 'physical' | 'digital';
  collect_shipping_upfront?: boolean | null;
  upfront_shipping_payment_method?: string | null;
}

export interface ProductData {
  id: string;
  product_type: 'physical' | 'digital';
  collect_shipping_upfront?: boolean | null;
  upfront_shipping_payment_method?: string | null;
}

export interface PaymentBreakdown {
  upfrontAmount: number;
  deliveryAmount: number;
  upfrontShippingFee: number;
  deliveryShippingFee: number;
  digitalProductsTotal: number;
  codProductsTotal: number;
  codProductsWithUpfrontShipping: number;
  codProductsWithoutUpfrontShipping: number;
  hasUpfrontPayment: boolean;
  hasDeliveryPayment: boolean;
}

/**
 * Calculate payment breakdown for cart items
 */
export function calculatePaymentBreakdown(
  items: CartItem[],
  shippingCost: number,
  productDataMap?: Map<string, ProductData>
): PaymentBreakdown {
  let upfrontAmount = 0;
  let deliveryAmount = 0;
  let upfrontShippingFee = 0;
  let deliveryShippingFee = 0;
  let digitalProductsTotal = 0;
  let codProductsTotal = 0;
  let codProductsWithUpfrontShipping = 0;
  let codProductsWithoutUpfrontShipping = 0;

  // Separate items by type and upfront shipping setting
  const codItemsWithUpfront: CartItem[] = [];
  const codItemsWithoutUpfront: CartItem[] = [];
  const digitalItems: CartItem[] = [];

  for (const item of items) {
    // Get product data from map if available, otherwise use item data
    const productData = productDataMap?.get(item.productId);
    const productType = productData?.product_type || item.product_type || 'physical';
    const collectUpfront = productData?.collect_shipping_upfront ?? item.collect_shipping_upfront ?? false;

    if (productType === 'digital') {
      digitalItems.push(item);
      digitalProductsTotal += item.price * item.quantity;
      upfrontAmount += item.price * item.quantity; // Digital products always paid upfront
    } else {
      // Physical/COD product
      codProductsTotal += item.price * item.quantity;
      
      if (collectUpfront) {
        codItemsWithUpfront.push(item);
        codProductsWithUpfrontShipping += item.price * item.quantity;
        // Product price is paid on delivery, not upfront
        deliveryAmount += item.price * item.quantity;
      } else {
        codItemsWithoutUpfront.push(item);
        codProductsWithoutUpfrontShipping += item.price * item.quantity;
        // Product price is paid on delivery
        deliveryAmount += item.price * item.quantity;
      }
    }
  }

  // Calculate shipping fee allocation
  // If there are COD products with upfront shipping, allocate shipping fee upfront
  // Otherwise, shipping is paid on delivery
  if (codItemsWithUpfront.length > 0) {
    // All shipping fee is collected upfront if any COD product has upfront shipping enabled
    upfrontShippingFee = shippingCost;
    deliveryShippingFee = 0;
    upfrontAmount += shippingCost;
  } else {
    // No upfront shipping, so shipping is paid on delivery
    upfrontShippingFee = 0;
    deliveryShippingFee = shippingCost;
    deliveryAmount += shippingCost;
  }

  // Add digital products to upfront amount (already added above)
  // upfrontAmount already includes digitalProductsTotal

  return {
    upfrontAmount,
    deliveryAmount,
    upfrontShippingFee,
    deliveryShippingFee,
    digitalProductsTotal,
    codProductsTotal,
    codProductsWithUpfrontShipping,
    codProductsWithoutUpfrontShipping,
    hasUpfrontPayment: upfrontAmount > 0,
    hasDeliveryPayment: deliveryAmount > 0,
  };
}

/**
 * Generate user-friendly payment breakdown message
 */
export function getPaymentBreakdownMessage(
  breakdown: PaymentBreakdown,
  currency: string = '৳'
): string | null {
  // Don't show message if there's no upfront payment required
  if (!breakdown.hasUpfrontPayment) {
    return null;
  }

  const parts: string[] = [];

  // Upfront payment details
  if (breakdown.upfrontShippingFee > 0 && breakdown.digitalProductsTotal > 0) {
    // Both shipping fee and digital products
    const shippingText = breakdown.codProductsWithUpfrontShipping > 0
      ? `shipping fee ${currency}${breakdown.upfrontShippingFee.toFixed(2)} for ${breakdown.codProductsWithUpfrontShipping > 0 ? 'COD product' : ''}`
      : '';
    const digitalText = `digital product ${currency}${breakdown.digitalProductsTotal.toFixed(2)}`;
    const totalText = `total ${currency}${breakdown.upfrontAmount.toFixed(2)}`;
    
    parts.push(`To place your order, you need to pay ${shippingText}${shippingText && digitalText ? ' and ' : ''}${digitalText}, ${totalText} to complete the order`);
  } else if (breakdown.upfrontShippingFee > 0) {
    // Only shipping fee upfront
    parts.push(`To place your order, you need to pay shipping fee ${currency}${breakdown.upfrontShippingFee.toFixed(2)} and product price ${currency}${breakdown.codProductsTotal.toFixed(2)} upon delivery`);
  } else if (breakdown.digitalProductsTotal > 0) {
    // Only digital products (no message needed, handled by normal flow)
    return null;
  }

  // Delivery payment details
  if (breakdown.hasDeliveryPayment) {
    const deliveryParts: string[] = [];
    if (breakdown.codProductsTotal > 0) {
      deliveryParts.push(`product price ${currency}${breakdown.codProductsTotal.toFixed(2)}`);
    }
    if (breakdown.deliveryShippingFee > 0) {
      deliveryParts.push(`shipping fee ${currency}${breakdown.deliveryShippingFee.toFixed(2)}`);
    }
    if (deliveryParts.length > 0) {
      parts.push(`You will pay ${deliveryParts.join(' and ')} upon delivery`);
    }
  }

  return parts.length > 0 ? parts.join('. ') + '.' : null;
}

/**
 * Get the payment method to use for upfront payment
 * Priority: Product's upfront_shipping_payment_method > customer selection > first available
 */
export function getUpfrontPaymentMethod(
  items: CartItem[],
  productDataMap: Map<string, ProductData>,
  customerSelectedMethod: string | null,
  availableMethods: string[]
): string | null {
  // Find products with upfront shipping
  const productsWithUpfront: ProductData[] = [];
  for (const item of items) {
    const productData = productDataMap.get(item.productId);
    if (productData?.collect_shipping_upfront && productData?.upfront_shipping_payment_method) {
      productsWithUpfront.push(productData);
    }
  }

  if (productsWithUpfront.length === 0) {
    // No upfront shipping, use customer selection or default
    return customerSelectedMethod || availableMethods[0] || null;
  }

  // Use the first product's upfront payment method (if multiple, use first one)
  const upfrontMethod = productsWithUpfront[0].upfront_shipping_payment_method;
  
  // Verify the method is available
  if (upfrontMethod && availableMethods.includes(upfrontMethod)) {
    return upfrontMethod;
  }

  // Fallback to customer selection or first available
  return customerSelectedMethod || availableMethods[0] || null;
}

/**
 * Check if cart requires upfront payment
 */
export function requiresUpfrontPayment(
  items: CartItem[],
  productDataMap?: Map<string, ProductData>
): boolean {
  for (const item of items) {
    const productData = productDataMap?.get(item.productId);
    const productType = productData?.product_type || item.product_type || 'physical';
    const collectUpfront = productData?.collect_shipping_upfront ?? item.collect_shipping_upfront ?? false;

    if (productType === 'digital' || collectUpfront) {
      return true;
    }
  }
  return false;
}

