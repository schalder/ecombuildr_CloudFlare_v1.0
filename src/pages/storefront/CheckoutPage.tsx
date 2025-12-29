import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useCart } from '@/contexts/CartContext';
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { usePixelContext } from '@/components/pixel/PixelManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Truck, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useEcomPaths } from '@/lib/pathResolver';
import { computeOrderShipping } from '@/lib/shipping-enhanced';
import { formatCurrency } from '@/lib/currency';
import { nameWithVariant } from '@/lib/utils';
import { useWebsiteShipping } from '@/hooks/useWebsiteShipping';
import { useWebsiteContext } from '@/contexts/WebsiteContext';
import { useChannelContext } from '@/hooks/useChannelContext';
import { isValidInternationalPhone } from '@/utils/phoneValidation';
import { calculatePaymentBreakdown, getPaymentBreakdownMessage, getUpfrontPaymentMethod, ProductData } from '@/utils/checkoutCalculations';

interface CheckoutForm {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_area: string;
  payment_method: 'cod' | 'bkash' | 'nagad' | 'eps' | 'ebpay';
  payment_transaction_number: string;
  notes: string;
  discount_code: string;
}


export const CheckoutPage: React.FC = () => {
  const { websiteId, websiteSlug } = useParams<{ websiteId?: string; websiteSlug?: string }>();
  const navigate = useNavigate();
  const { store } = useStore();
  const { items, total, clearCart } = useCart();
  const paths = useEcomPaths();
  const { pixels } = usePixelContext();
  const { websiteId: contextWebsiteId } = useWebsiteContext();
  const { websiteId: resolvedWebsiteId, funnelId: resolvedFunnelId } = useChannelContext();
  const { trackInitiateCheckout, trackPurchase, trackAddPaymentInfo } = usePixelTracking(pixels, store?.id, resolvedWebsiteId, resolvedFunnelId);
  const isWebsiteContext = Boolean(websiteId || websiteSlug || contextWebsiteId);
  
  // Error states
  const [phoneError, setPhoneError] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasTrackedCheckout, setHasTrackedCheckout] = useState(false);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0); // Default shipping cost
  const { websiteShipping } = useWebsiteShipping();

  const [allowedMethods, setAllowedMethods] = useState<Array<'cod' | 'bkash' | 'nagad' | 'eps' | 'ebpay'>>(['cod','bkash','nagad','eps','ebpay']);

  const [form, setForm] = useState<CheckoutForm>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    shipping_city: '',
    shipping_area: '',
    payment_method: 'cod',
    payment_transaction_number: '',
    notes: '',
    discount_code: '',
  });

  // Check if cart contains only digital products
  const isDigitalOnlyCart = items.every(item => {
    // We'll check the product type from the database when needed
    return false; // For now, assume all are physical
  });

  const [hasDigitalProducts, setHasDigitalProducts] = useState(false);
  const [hasPhysicalProducts, setHasPhysicalProducts] = useState(false);
  const [productDataMap, setProductDataMap] = useState<Map<string, ProductData>>(new Map());
  const [paymentBreakdown, setPaymentBreakdown] = useState<ReturnType<typeof calculatePaymentBreakdown> | null>(null);

// Recompute shipping cost when address details or settings change
useEffect(() => {
  const computeShipping = async () => {
    // Skip shipping calculation for digital-only orders
    if (hasDigitalProducts && !hasPhysicalProducts) {
      setShippingCost(0);
      return;
    }
    
    if (!websiteShipping || !websiteShipping.enabled) {
      setShippingCost(0);
      return;
    }

    // Get product weights for cart items
    const itemsWithWeight = await Promise.all(
      items.map(async (item) => {
        const { data: product } = await supabase
          .from('products')
          .select('weight_grams')
          .eq('id', item.productId)
          .single();
        
        return {
          ...item,
          weight_grams: product?.weight_grams || 0,
        };
      })
    );

    const result = computeOrderShipping(
      websiteShipping,
      itemsWithWeight,
      {
        city: form.shipping_city,
        area: form.shipping_area,
        address: form.shipping_address,
      },
      total
    );

    setShippingCost(result.shippingCost);
  };

  computeShipping();
}, [websiteShipping, form.shipping_city, form.shipping_area, form.shipping_address, items, total, hasDigitalProducts, hasPhysicalProducts]);

  // Calculate payment breakdown when shipping cost, items, or product data changes
  useEffect(() => {
    if (items.length === 0 || productDataMap.size === 0) {
      setPaymentBreakdown(null);
      return;
    }

    const cartItems = items.map(item => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      product_type: productDataMap.get(item.productId)?.product_type,
      collect_shipping_upfront: productDataMap.get(item.productId)?.collect_shipping_upfront,
      upfront_shipping_payment_method: productDataMap.get(item.productId)?.upfront_shipping_payment_method,
    }));

    const breakdown = calculatePaymentBreakdown(cartItems, shippingCost, productDataMap);
    setPaymentBreakdown(breakdown);
  }, [items, shippingCost, productDataMap]);

  // Check product types and derive allowed payment methods
  useEffect(() => {
    const loadProductData = async () => {
      const storeAllowed: Record<string, boolean> = {
        cod: true,
        bkash: !!store?.settings?.bkash?.enabled,
        nagad: !!store?.settings?.nagad?.enabled,
        eps: !!store?.settings?.eps?.enabled,
        ebpay: !!store?.settings?.ebpay?.enabled,
      };

      // Empty cart: fall back to store-level enabled list
      if (!items.length) {
        let base = ['cod','bkash','nagad','eps','ebpay'].filter((m) => (storeAllowed as any)[m]);
        if (base.length === 0) base = ['cod'];
        setAllowedMethods(base as any);
        if (!base.includes(form.payment_method)) {
          setForm(prev => ({ ...prev, payment_method: (base[0] as any) }));
        }
        setHasDigitalProducts(false);
        setHasPhysicalProducts(false);
        return;
      }

      const ids = Array.from(new Set(items.map(i => i.productId)));
      const { data } = await supabase
        .from('products')
        .select('id, allowed_payment_methods, product_type, collect_shipping_upfront, upfront_shipping_payment_method')
        .in('id', ids);
      
      // Build product data map for calculations
      const productMap = new Map<string, ProductData>();
      
      // Check product types
      let hasDigital = false;
      let hasPhysical = false;
      
      let acc: string[] = ['cod','bkash','nagad','eps','ebpay'];
      (data || []).forEach((p: any) => {
        // Store product data for calculations
        productMap.set(p.id, {
          id: p.id,
          product_type: p.product_type || 'physical',
          collect_shipping_upfront: p.collect_shipping_upfront || false,
          upfront_shipping_payment_method: p.upfront_shipping_payment_method || null,
        });
        
        if (p.product_type === 'digital') {
          hasDigital = true;
        } else {
          hasPhysical = true;
        }
        
        const arr: string[] | null = p.allowed_payment_methods;
        if (arr && arr.length > 0) {
          acc = acc.filter(m => arr.includes(m));
        }
      });
      
      setProductDataMap(productMap);
      setHasDigitalProducts(hasDigital);
      setHasPhysicalProducts(hasPhysical);
      
      // Intersect with store-level enabled methods
      acc = acc.filter((m) => (storeAllowed as any)[m]);
      if (acc.length === 0) acc = ['cod'];
      setAllowedMethods(acc as any);
      if (!acc.includes(form.payment_method)) {
        setForm(prev => ({ ...prev, payment_method: acc[0] as any }));
      }
    };
    loadProductData();
  }, [items, store]);

  const handleInputChange = (field: keyof CheckoutForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!form.customer_name || !form.customer_email || !form.customer_phone) return false;
        // Validate phone format using international validation
        return isValidInternationalPhone(form.customer_phone);
      case 2:
        // Skip shipping validation for digital-only orders
        if (hasDigitalProducts && !hasPhysicalProducts) return true;
        return !!(form.shipping_address && form.shipping_city);
      case 3:
        if (!form.payment_method) return false;
        // Check if manual payment requires transaction number
        const hasBkashApi = !!(store?.settings?.bkash?.app_key && store?.settings?.bkash?.app_secret && store?.settings?.bkash?.username && store?.settings?.bkash?.password);
        const isBkashManual = !!(store?.settings?.bkash?.enabled && (store?.settings?.bkash?.mode === 'number' || !hasBkashApi) && store?.settings?.bkash?.number);
        const hasNagadApi = !!(store?.settings?.nagad?.merchant_id && store?.settings?.nagad?.public_key && store?.settings?.nagad?.private_key);
        const isNagadManual = !!(store?.settings?.nagad?.enabled && (store?.settings?.nagad?.mode === 'number' || !hasNagadApi) && store?.settings?.nagad?.number);
        const isManual = (form.payment_method === 'bkash' && isBkashManual) || (form.payment_method === 'nagad' && isNagadManual);
        if (isManual && !form.payment_transaction_number?.trim()) return false;
        return true;
      default:
        return true;
    }
  };

  const applyDiscountCode = async () => {
    if (!form.discount_code.trim() || !store) return;

    setDiscountLoading(true);
    try {
      const { data: discountCode, error } = await supabase
        .from('discount_codes' as any)
        .select('*')
        .eq('store_id', store.id)
        .eq('code', form.discount_code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !discountCode) {
        toast.error('Invalid discount code');
        setDiscountAmount(0);
        return;
      }

      // Type assertion for the discount code object
      const discount = discountCode as any;

      // Check if discount is expired
      if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
        toast.error('Discount code has expired');
        setDiscountAmount(0);
        return;
      }

      // Check if discount hasn't started yet
      if (discount.starts_at && new Date(discount.starts_at) > new Date()) {
        toast.error('Discount code is not active yet');
        setDiscountAmount(0);
        return;
      }

      // Check usage limit
      if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
        toast.error('Discount code usage limit reached');
        setDiscountAmount(0);
        return;
      }

      // Check minimum amount
      if (discount.minimum_amount && total < discount.minimum_amount) {
        toast.error(`Minimum order amount is ${formatCurrency(discount.minimum_amount)} for this discount`);
        setDiscountAmount(0);
        return;
      }

      // Calculate discount amount
      let discountValue = 0;
      if (discount.type === 'percentage') {
        discountValue = (total * discount.value) / 100;
      } else if (discount.type === 'fixed') {
        discountValue = discount.value;
      }

      // Ensure discount doesn't exceed total
      discountValue = Math.min(discountValue, total);
      setDiscountAmount(discountValue);
      toast.success(`Discount code applied! You saved ${formatCurrency(discountValue)}`);
    } catch (error) {
      console.error('Error applying discount:', error);
      toast.error('Error applying discount code');
      setDiscountAmount(0);
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleSubmitOrder = async () => {
    console.log('🚀 handleSubmitOrder called', { store: !!store, itemsCount: items.length });
    
    if (!store || items.length === 0) {
      console.log('❌ Early return: no store or items', { store: !!store, itemsCount: items.length });
      return;
    }

    // Normalize phone before submitting
    const normalizedPhone = normalizeBdPhone(form.customer_phone);
    console.log('📞 Phone normalization:', { original: form.customer_phone, normalized: normalizedPhone });
    
    if (!normalizedPhone || normalizedPhone.length < 11) {
      console.log('❌ Early return: invalid phone', { normalizedPhone, length: normalizedPhone?.length });
      setPhoneError('Please enter a valid phone number');
      setCurrentStep(1); // Go back to step 1 to show error
      return;
    }

    console.log('✅ Validation passed, starting order submission...');
    setLoading(true);
    
    // Generate idempotency key for this submission
    const idempotencyKey = crypto.randomUUID();
    console.log('🔑 Generated idempotency key:', idempotencyKey);
    
    try {
      console.log('📊 Starting payment breakdown calculation...');
      // Recalculate payment breakdown to ensure we have latest data
      const cartItems = items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        product_type: productDataMap.get(item.productId)?.product_type,
        collect_shipping_upfront: productDataMap.get(item.productId)?.collect_shipping_upfront,
        upfront_shipping_payment_method: productDataMap.get(item.productId)?.upfront_shipping_payment_method,
      }));

      const currentPaymentBreakdown = calculatePaymentBreakdown(
        cartItems,
        shippingCost,
        productDataMap
      );

      // Use recalculated breakdown instead of state
      const upfrontAmount = currentPaymentBreakdown.upfrontAmount || 0;
      const upfrontPaymentMethod = upfrontAmount > 0 
        ? getUpfrontPaymentMethod(
            cartItems,
            productDataMap,
            form.payment_method,
            allowedMethods
          )
        : null;

      // Determine manual number-only mode
      const hasBkashApi = !!(store?.settings?.bkash?.app_key && store?.settings?.bkash?.app_secret && store?.settings?.bkash?.username && store?.settings?.bkash?.password);
      const isBkashManual = !!(store?.settings?.bkash?.enabled && (store?.settings?.bkash?.mode === 'number' || !hasBkashApi) && store?.settings?.bkash?.number);
      const hasNagadApi = !!(store?.settings?.nagad?.merchant_id && store?.settings?.nagad?.public_key && store?.settings?.nagad?.private_key);
      const isNagadManual = !!(store?.settings?.nagad?.enabled && (store?.settings?.nagad?.mode === 'number' || !hasNagadApi) && store?.settings?.nagad?.number);
      const isManual = (form.payment_method === 'bkash' && isBkashManual) || (form.payment_method === 'nagad' && isNagadManual);

      const orderData = {
        store_id: store.id,
        website_id: resolvedWebsiteId,
        funnel_id: resolvedFunnelId,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: normalizedPhone,
        shipping_address: form.shipping_address,
        shipping_city: form.shipping_city,
        shipping_area: form.shipping_area,
        payment_method: form.payment_method,
        payment_transaction_number: form.payment_transaction_number,
        notes: form.notes,
        subtotal: total,
        shipping_cost: shippingCost,
        discount_amount: discountAmount,
        discount_code: form.discount_code || null,
        total: total + shippingCost - discountAmount,
        // Status will be set by create-order or create-order-on-payment-success based on payment method and product types
        order_number: `ORD-${Date.now()}`,
        idempotency_key: idempotencyKey,
        // Upfront payment info (if applicable)
        upfront_payment_amount: upfrontAmount > 0 ? upfrontAmount : null,
        upfront_payment_method: upfrontPaymentMethod || null,
        delivery_payment_amount: currentPaymentBreakdown.deliveryAmount || null,
      };

      const itemsPayload = items.map(item => ({
        product_id: item.productId,
        product_name: item.name,
        product_sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        variation: item.variation || {},
        image: item.image || null,
      }));

      // Helper function to check if a payment method requires gateway processing (live payment)
      const isLivePaymentMethod = (method: string | null | undefined): boolean => {
        if (!method) return false;
        // Live payment methods that require gateway processing before order creation
        return method === 'eps' || method === 'ebpay' || method === 'stripe';
      };

      // Determine if we need to process upfront payment (calculate BEFORE debug log and order creation)
      const hasUpfrontPayment = upfrontAmount > 0 && upfrontPaymentMethod;
      const upfrontPaymentIsLive = hasUpfrontPayment && isLivePaymentMethod(upfrontPaymentMethod);
      const isLivePayment = isLivePaymentMethod(form.payment_method);

      // Debug: Log payment breakdown for troubleshooting
      console.log('🔍 Payment Processing Debug:', {
        paymentBreakdown: currentPaymentBreakdown,
        upfrontAmount,
        upfrontPaymentMethod,
        selectedPaymentMethod: form.payment_method,
        hasUpfrontPayment,
        upfrontPaymentIsLive,
        isLivePayment,
        allowedMethods,
        productDataMapSize: productDataMap.size,
        itemsCount: items.length,
        cartItems: cartItems.map(item => ({
          id: item.id,
          productId: item.productId,
          product_type: productDataMap.get(item.productId)?.product_type,
          collect_shipping_upfront: productDataMap.get(item.productId)?.collect_shipping_upfront,
          upfront_shipping_payment_method: productDataMap.get(item.productId)?.upfront_shipping_payment_method
        })),
        willDeferOrderCreation: isLivePayment || upfrontPaymentIsLive,
        willProcessUpfrontPayment: hasUpfrontPayment,
        calculationDetails: {
          upfrontAmountGreaterThanZero: upfrontAmount > 0,
          upfrontPaymentMethodExists: !!upfrontPaymentMethod,
          upfrontPaymentMethodValue: upfrontPaymentMethod,
          upfrontPaymentMethodInAllowed: upfrontPaymentMethod ? allowedMethods.includes(upfrontPaymentMethod) : false
        }
      });
      
      let createdOrderId: string | undefined;
      let accessToken: string | undefined;

      // DECISION: Create order now or defer?
      // Defer order creation if:
      // 1. Selected payment method is live (EPS, EB Pay, Stripe) - for regular payments
      // 2. OR upfront payment is needed and it's a live method - for upfront payments
      if (isLivePayment || upfrontPaymentIsLive) {
        // Store checkout data temporarily for order creation after payment
        sessionStorage.setItem('pending_checkout', JSON.stringify({
          orderData,
          itemsPayload,
          storeId: store.id,
          timestamp: Date.now()
        }));
        
        // Generate temporary ID for tracking
        createdOrderId = crypto.randomUUID();
      } else {
        // Create order immediately for:
        // - COD payments (no upfront payment OR upfront is manual)
        // - Manual payments (bKash, Nagad) without upfront
        const { data, error: createErr } = await supabase.functions.invoke('create-order', {
          body: {
            order: orderData,
            items: itemsPayload,
            storeId: store.id,
          }
        });
        if (createErr) throw createErr;
        createdOrderId = data?.order?.id;
        if (!createdOrderId) throw new Error('Order was not created');
        accessToken = data?.order?.access_token;
      }
      

      // Track purchase event for COD orders
      if (form.payment_method === 'cod') {
        trackPurchase({
          transaction_id: createdOrderId,
          value: finalTotal,
          items: items.map(item => ({
            item_id: item.productId,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity,
            item_variant: item.variation ? JSON.stringify(item.variation) : undefined,
          })),
        });
      }

      // Update discount code usage if applied (only for non-live payments)
      if (!isLivePayment && discountAmount > 0 && form.discount_code) {
        const { data: currentDiscount } = await supabase
          .from('discount_codes' as any)
          .select('used_count')
          .eq('store_id', store.id)
          .eq('code', form.discount_code.toUpperCase())
          .maybeSingle();
        if (currentDiscount) {
          await supabase
            .from('discount_codes' as any)
            .update({ used_count: (currentDiscount as any).used_count + 1, updated_at: new Date().toISOString() })
            .eq('store_id', store.id)
            .eq('code', form.discount_code.toUpperCase());
        }
      }

      // Handle payment processing
      // PRIORITY: Check for upfront payment FIRST, regardless of selected payment method
      console.log('🔍 Before upfront payment check:', {
        hasUpfrontPayment,
        upfrontAmount,
        upfrontPaymentMethod,
        upfrontPaymentIsLive,
        createdOrderId,
        willProcessUpfront: hasUpfrontPayment
      });

      if (hasUpfrontPayment) {
        console.log('✅ Upfront payment detected, processing...');
        
        // Validate that we have a valid payment method
        if (!upfrontPaymentMethod) {
          console.error('❌ Upfront payment method is null!');
          toast.error('Payment method not available. Please select a different payment method.');
          setLoading(false);
          return;
        }

        // Validate that the payment method is in allowed methods
        if (!allowedMethods.includes(upfrontPaymentMethod)) {
          console.error('❌ Upfront payment method not in allowed methods:', {
            upfrontPaymentMethod,
            allowedMethods
          });
          toast.error(`Payment method ${upfrontPaymentMethod} is not available for this order.`);
          setLoading(false);
          return;
        }

        // Check if the upfront payment method requires gateway processing
        if (upfrontPaymentIsLive) {
          console.log('✅ Upfront payment is live, initiating payment gateway...', {
            orderId: createdOrderId,
            amount: upfrontAmount,
            method: upfrontPaymentMethod
          });
          try {
            // Process upfront payment for live payment methods (EPS, EB Pay, Stripe, etc.)
            // Order creation is deferred - payment gateway will create order after successful payment
            await initiatePayment(createdOrderId, upfrontAmount, upfrontPaymentMethod, accessToken);
            console.log('✅ Payment initiation completed, redirecting to gateway...');
            return; // Exit early - payment gateway will handle order creation
          } catch (error) {
            console.error('❌ Failed to initiate upfront payment:', error);
            toast.error('Failed to initiate payment. Please try again.');
            setLoading(false);
            return;
          }
        } else {
          console.log('ℹ️ Upfront payment is manual, showing confirmation...');
          // Manual payment method for upfront (bkash, nagad) - order already created above
          clearCart();
          toast.success('Order placed! Please complete the upfront payment.');
          navigate(paths.orderConfirmation(createdOrderId, accessToken));
          return; // Exit early after showing confirmation
        }
      } else {
        console.log('ℹ️ No upfront payment required, processing regular flow...');
      }
      
      // If no upfront payment needed, process regular payment flow
      if (form.payment_method === 'cod' || isManual) {
        // Regular COD or manual payment (no upfront payment required)
        clearCart();
        toast.success(isManual ? 'Order placed! Please complete payment to the provided number.' : 'Order placed successfully!');
        navigate(paths.orderConfirmation(createdOrderId, accessToken));
      } else {
        // Regular live payment (no upfront shipping) - selected method is live (EPS, EB Pay, Stripe)
        // Order creation is deferred - payment gateway will create order after successful payment
        await initiatePayment(createdOrderId, finalTotal, form.payment_method, accessToken);
      }
    } catch (error) {
      console.error('❌ ERROR in handleSubmitOrder:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      toast.error('Failed to place order. Please try again.');
    } finally {
      console.log('🏁 handleSubmitOrder finally block - setting loading to false');
      setLoading(false);
    }
  };

  const initiatePayment = async (orderId: string, amount: number, method: string, accessToken?: string) => {
    try {
      let response;
      
      // Get stored checkout data for live payments
      const pendingCheckout = sessionStorage.getItem('pending_checkout');
      const checkoutData = pendingCheckout ? JSON.parse(pendingCheckout) : null;
      
      switch (method) {
        case 'bkash':
          response = await supabase.functions.invoke('bkash-payment', {
            body: { orderId, amount, storeId: store!.id }
          });
          break;
        case 'nagad':
          response = await supabase.functions.invoke('nagad-payment', {
            body: { orderId, amount, storeId: store!.id }
          });
          break;
        case 'eps':
          response = await supabase.functions.invoke('eps-payment', {
            body: { 
              tempOrderId: orderId,
              amount, 
              storeId: store!.id,
              orderData: checkoutData?.orderData,
              itemsData: checkoutData?.itemsPayload,
              customerData: {
                name: form.customer_name,
                email: form.customer_email,
                phone: form.customer_phone,
                address: form.shipping_address,
                city: form.shipping_city,
              }
            }
          });
          break;
        case 'ebpay':
          response = await supabase.functions.invoke('ebpay-payment', {
            body: { 
              tempOrderId: orderId,
              amount, 
              storeId: store!.id,
              orderData: checkoutData?.orderData,
              itemsData: checkoutData?.itemsPayload,
              redirectOrigin: window.location.origin,
              customerData: {
                name: form.customer_name,
                email: form.customer_email,
                phone: form.customer_phone,
                address: form.shipping_address,
                city: form.shipping_city,
              }
            }
          });
          break;
        case 'stripe':
          // Store original origin for redirects (preserves custom domain)
          sessionStorage.setItem('payment_origin', window.location.origin);
          
          response = await supabase.functions.invoke('stripe-payment', {
            body: {
              tempOrderId: orderId,
              amount,
              storeId: store!.id,
              orderData: checkoutData?.orderData,
              itemsData: checkoutData?.itemsPayload,
              redirectOrigin: window.location.origin,
              currency: 'USD', // Default to USD, can be made configurable
              customerData: {
                name: form.customer_name,
                email: form.customer_email,
                phone: form.customer_phone,
                address: form.shipping_address,
                city: form.shipping_city,
              }
            }
          });
          break;
        default:
          throw new Error('Invalid payment method');
      }

      if (response.error) {
        throw new Error(response.error.message || 'Payment gateway error');
      }

      const { paymentURL } = response.data;
      if (!paymentURL) {
        throw new Error('Payment URL not received from gateway');
      }

      // Show loading message and redirect to payment gateway
      toast.success('Redirecting to payment gateway...');
      // Cart will be cleared after successful payment verification
      window.location.href = paymentURL;
    } catch (error) {
      console.error('Payment initiation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.';
      toast.error(errorMessage);
      throw error; // Re-throw to let caller handle
    }
  };

  if (!store) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Store not found</div>
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Your cart is empty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">Add products to your cart before checking out.</p>
            <div className="flex gap-3">
              <Button onClick={() => navigate(paths.products)}>Continue Shopping</Button>
              <Button variant="outline" onClick={() => navigate(paths.home)}>Go to Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const finalTotal = total + shippingCost - discountAmount;

  // Track InitiateCheckout event when page loads with items in cart
  useEffect(() => {
    if (!hasTrackedCheckout && items.length > 0 && store && total > 0) {
      
      trackInitiateCheckout({
        value: finalTotal,
        items: items.map(item => ({
          item_id: item.productId,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
          item_variant: item.variation ? JSON.stringify(item.variation) : undefined,
        })),
      });
      setHasTrackedCheckout(true);
    } else if (items.length === 0) {
      console.log('🛒 No items in cart, skipping InitiateCheckout tracking');
    } else if (!store) {
      console.log('🛒 Store not loaded yet, skipping InitiateCheckout tracking');
    } else if (hasTrackedCheckout) {
      console.log('🛒 InitiateCheckout already tracked this session');
    }
  }, [items, store, total, hasTrackedCheckout, finalTotal, trackInitiateCheckout]);

  // Track add payment info when payment method is selected
  useEffect(() => {
    if (form.payment_method && currentStep >= 3 && items.length > 0) {
      trackAddPaymentInfo({
        currency: 'BDT',
        value: finalTotal,
        payment_type: form.payment_method,
        items: items.map(item => ({
          item_id: item.productId,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
          item_variant: item.variation ? JSON.stringify(item.variation) : undefined,
        })),
      });
    }
  }, [form.payment_method, currentStep, finalTotal, items, trackAddPaymentInfo]);

  const checkoutContent = (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <div className="flex justify-center mt-4 space-x-4">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Customer Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Full Name *</Label>
                    <Input
                      id="customer_name"
                      value={form.customer_name}
                      onChange={(e) => handleInputChange('customer_name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">Phone Number *</Label>
                    <div className="space-y-1">
                      <Input
                        id="customer_phone"
                        value={form.customer_phone}
                        onChange={(e) => {
                          handleInputChange('customer_phone', e.target.value);
                          setPhoneError(''); // Clear error on input
                        }}
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            const normalized = normalizeBdPhone(e.target.value);
                            if (!normalized || normalized.length < 11) {
                              setPhoneError('Please enter a valid phone number');
                            }
                          }
                        }}
                        placeholder="Enter your phone number"
                        aria-invalid={!!phoneError}
                        aria-describedby={phoneError ? 'phone-error-checkout' : undefined}
                        className={phoneError ? 'border-destructive focus-visible:ring-destructive' : undefined}
                      />
                      {phoneError && (
                        <p id="phone-error-checkout" className="text-sm text-destructive" role="alert">
                          {phoneError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="customer_email">Email Address *</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={form.customer_email}
                    onChange={(e) => handleInputChange('customer_email', e.target.value)}
                    placeholder="Enter your email address"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Shipping Information */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shipping_address">Address *</Label>
                  <Textarea
                    id="shipping_address"
                    value={form.shipping_address}
                    onChange={(e) => handleInputChange('shipping_address', e.target.value)}
                    placeholder="Enter your complete address"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shipping_city">City *</Label>
                    <Input
                      id="shipping_city"
                      value={form.shipping_city}
                      onChange={(e) => handleInputChange('shipping_city', e.target.value)}
                      placeholder="Enter your city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping_area">Area</Label>
                    <Input
                      id="shipping_area"
                      value={form.shipping_area}
                      onChange={(e) => handleInputChange('shipping_area', e.target.value)}
                      placeholder="Enter your area"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Payment Method */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={form.payment_method}
                  onValueChange={(value) => handleInputChange('payment_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedMethods.includes('cod') && (
                      <SelectItem value="cod">Cash on Delivery (COD)</SelectItem>
                    )}
                    {allowedMethods.includes('bkash') && (
                      <SelectItem value="bkash">bKash</SelectItem>
                    )}
                    {allowedMethods.includes('nagad') && (
                      <SelectItem value="nagad">Nagad</SelectItem>
                    )}
                    {allowedMethods.includes('eps') && (
                      <SelectItem value="eps">Bank/Card/MFS (EPS)</SelectItem>
                    )}
                    {allowedMethods.includes('ebpay') && (
                      <SelectItem value="ebpay">EB Pay</SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {/* Show transaction number field for manual bKash payments */}
                {form.payment_method === 'bkash' && store?.settings?.bkash?.mode === 'number' && store?.settings?.bkash?.number && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Pay to bKash number: {store.settings.bkash.number}</p>
                    <Input
                      placeholder="Enter transaction ID (e.g., 8M5HA84D5K)"
                      value={form.payment_transaction_number}
                      onChange={(e) => setForm(f => ({ ...f, payment_transaction_number: e.target.value }))}
                      className="w-full"
                      required
                    />
                  </div>
                )}
                
                {/* Show transaction number field for manual Nagad payments */}
                {form.payment_method === 'nagad' && store?.settings?.nagad?.mode === 'number' && store?.settings?.nagad?.number && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Pay to Nagad number: {store.settings.nagad.number}</p>
                    <Input
                      placeholder="Enter transaction ID (e.g., NG8M5HA84D5K)"
                      value={form.payment_transaction_number}
                      onChange={(e) => setForm(f => ({ ...f, payment_transaction_number: e.target.value }))}
                      className="w-full"
                      required
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any special instructions for your order"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Order Review */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Order Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Customer Information:</h3>
                  <p>{form.customer_name}</p>
                  <p>{form.customer_email}</p>
                  <p>{form.customer_phone}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold">Shipping Address:</h3>
                  <p>{form.shipping_address}</p>
                  <p>{form.shipping_city}, {form.shipping_area}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold">Payment Method:</h3>
                  <p>
                    {form.payment_method === 'cod' && 'Cash on Delivery (COD)'}
                    {form.payment_method === 'bkash' && 'bKash'}
                    {form.payment_method === 'nagad' && 'Nagad'}
                    {form.payment_method === 'eps' && 'Bank/Card/MFS (EPS)'}
                    {form.payment_method === 'ebpay' && 'EB Pay'}
                  </p>
                </div>
                {form.notes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold">Notes:</h3>
                      <p>{form.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            {currentStep < 4 ? (
              <Button
                onClick={() => {
                  const nextStep = currentStep + 1;
                  setCurrentStep(nextStep);
                  
                  // Track AddPaymentInfo when entering payment step (step 3)
                  if (nextStep === 3) {
                    trackAddPaymentInfo({
                      currency: 'BDT',
                      value: total + shippingCost - discountAmount,
                      items: items.map(item => ({
                        item_id: item.productId,
                        item_name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        item_category: 'product',
                      })),
                    });
                  }
                }}
                disabled={!validateStep(currentStep)}
              >
                Next
              </Button>
            ) : (
              <>
                {/* Payment Breakdown Message */}
                {paymentBreakdown && paymentBreakdown.hasUpfrontPayment && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                      {getPaymentBreakdownMessage(paymentBreakdown, '৳')}
                    </p>
                  </div>
                )}
                <Button
                  onClick={(e) => {
                    console.log('🖱️ BUTTON CLICKED!', { loading, disabled: loading });
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmitOrder();
                  }}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{nameWithVariant(item.name, item.variation)} × {item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Discount Code */}
              <div className="space-y-2">
                <Label htmlFor="discount_code">Discount Code</Label>
                <div className="flex space-x-2">
                  <Input
                    id="discount_code"
                    value={form.discount_code}
                    onChange={(e) => handleInputChange('discount_code', e.target.value.toUpperCase())}
                    placeholder="Enter code"
                  />
                  <Button
                    variant="outline"
                    onClick={applyDiscountCode}
                    disabled={discountLoading}
                    size="sm"
                  >
                    Apply
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{formatCurrency(shippingCost)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const fullCheckoutContent = (
    <div className="container mx-auto px-4 py-8">
      {!store ? (
        <div className="text-center">Store not found</div>
      ) : items.length === 0 ? (
        <div className="py-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Your cart is empty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">Add products to your cart before checking out.</p>
              <div className="flex gap-3">
                <Button onClick={() => navigate(paths.products)}>Continue Shopping</Button>
                <Button variant="outline" onClick={() => navigate(paths.home)}>Go to Home</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        checkoutContent
      )}
    </div>
  );

  if (isWebsiteContext) {
    return fullCheckoutContent;
  }

  return fullCheckoutContent;
};