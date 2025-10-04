import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { PageBuilderElement } from '../types';
import { elementRegistry } from './ElementRegistry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/contexts/StoreContext';
import { useStoreProducts } from '@/hooks/useStoreData';
import { useWebsiteShipping } from '@/hooks/useWebsiteShipping';
import { useNavigate, useParams } from 'react-router-dom';
import { useEcomPaths } from '@/lib/pathResolver';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import { generateResponsiveCSS, mergeResponsiveStyles } from '@/components/page-builder/utils/responsiveStyles';
import { StorefrontImage } from '@/components/storefront/renderer/StorefrontImage';
import { computeOrderShipping, getAvailableShippingOptions, applyShippingOptionToForm } from '@/lib/shipping-enhanced';
import type { CartItem, ShippingOption } from '@/lib/shipping-enhanced';
import { ShippingOptionsPicker } from '@/components/storefront/ShippingOptionsPicker';
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { usePixelContext } from '@/components/pixel/PixelManager';
import { useResolvedWebsiteId } from '@/hooks/useResolvedWebsiteId';
import { useFunnelStepContext } from '@/contexts/FunnelStepContext';
import { useHeadStyle } from '@/hooks/useHeadStyle';

const InlineCheckoutElement: React.FC<{ element: PageBuilderElement; deviceType?: 'desktop' | 'tablet' | 'mobile' }> = ({ element, deviceType = 'desktop' }) => {
  const navigate = useNavigate();
  const { websiteId, funnelId } = useParams<{ websiteId?: string; funnelId?: string }>();
  const paths = useEcomPaths();
  const { store, loadStoreById } = useStore();
  const { pixels } = usePixelContext();
  const { stepId } = useFunnelStepContext();
  const { trackPurchase, trackInitiateCheckout } = usePixelTracking(pixels, store?.id, websiteId, funnelId);
  
  // Error states
  const [phoneError, setPhoneError] = useState<string>('');
  
  // Load funnel step data for success redirect
  const [funnelStepData, setFunnelStepData] = useState<any>(null);
  
  useEffect(() => {
    if (!stepId) return;
    
    const loadFunnelStepData = async () => {
      try {
        const { data: step, error } = await supabase
          .from('funnel_steps')
          .select('on_success_step_id, funnel_id')
          .eq('id', stepId)
          .single();
        
        if (error) throw error;
        setFunnelStepData(step);
      } catch (error) {
        console.error('Error loading funnel step data:', error);
      }
    };
    
    loadFunnelStepData();
  }, [stepId]);
  
  // Resolve websiteId for filtering
  const resolvedWebsiteId = useResolvedWebsiteId(element);

  const cfg: any = element.content || {};
  const productIds: string[] = Array.isArray(cfg.productIds) ? cfg.productIds : [];
  const allowSwitching: boolean = cfg.allowSwitching !== false; // default true
  const successRedirectUrl: string = cfg.successRedirectUrl || '';
  const showQuantity: boolean = cfg.showQuantity !== false; // default true
  const headings = cfg.headings || { info: 'Customer Information', shipping: 'Shipping', payment: 'Payment', summary: 'Order Summary' };
  const sections = cfg.sections || { info: true, shipping: true, payment: true, summary: true };
  const fields = cfg.fields || {
    fullName: { enabled: true, required: true, placeholder: 'Full Name' },
    phone: { enabled: true, required: true, placeholder: 'Phone Number' },
    email: { enabled: true, required: false, placeholder: 'Email Address' },
    address: { enabled: true, required: true, placeholder: 'Street address' },
    city: { enabled: true, required: true, placeholder: 'City' },
    area: { enabled: true, required: false, placeholder: 'Area' },
    country: { enabled: true, required: false, placeholder: 'Country' },
    state: { enabled: true, required: false, placeholder: 'State/Province' },
    postalCode: { enabled: true, required: false, placeholder: 'ZIP / Postal code' },
  };
  const customFields: any[] = cfg.customFields || [];
  const terms = cfg.terms || { enabled: false, required: true, label: 'I agree to the Terms & Conditions', url: '/terms' };
  const trust = cfg.trustBadge || { enabled: false, imageUrl: '', alt: 'Secure checkout' };
  const buttonLabel: string = cfg.placeOrderLabel || 'Place Order';
  const showItemImages: boolean = cfg.showItemImages ?? true;
  const orderBump = cfg.orderBump || { enabled: false, productId: '', label: 'Add this to my order', description: '', prechecked: false };
  const chargeShippingForBump: boolean = cfg.chargeShippingForBump !== false;
  const bumpShippingFee: number = cfg.bumpShippingFee || 0;

  // Load store via websiteId or funnelId if provided
  useEffect(() => {
    (async () => {
      if (!store) {
        if (websiteId) {
          const { data: website } = await supabase.from('websites').select('store_id').eq('id', websiteId).maybeSingle();
          if (website?.store_id) await loadStoreById(website.store_id);
        } else if (funnelId) {
          const { data: funnel } = await supabase.from('funnels').select('store_id').eq('id', funnelId).maybeSingle();
          if (funnel?.store_id) await loadStoreById(funnel.store_id);
        }
      }
    })();
  }, [store, websiteId, funnelId, loadStoreById]);

  // Load configured products (include bump product if set)
  const allProductIds = useMemo(() => Array.from(new Set([...(productIds || []), cfg?.orderBump?.productId].filter(Boolean))), [productIds, cfg?.orderBump?.productId]);
  const { products, loading: productsLoading } = useStoreProducts({ specificProductIds: allProductIds, websiteId: resolvedWebsiteId });
  const defaultProductId: string = useMemo(() => {
    if (cfg.defaultProductId && productIds.includes(cfg.defaultProductId)) return cfg.defaultProductId;
    return productIds[0] || '';
  }, [cfg.defaultProductId, productIds]);

  const [selectedId, setSelectedId] = useState<string>(defaultProductId);
  useEffect(() => { setSelectedId((prev) => (productIds.includes(prev) ? prev : defaultProductId)); }, [defaultProductId, productIds]);
  const [quantity, setQuantity] = useState<number>(1);
  const [bumpChecked, setBumpChecked] = useState<boolean>(!!orderBump.prechecked);

  const selectedProduct = useMemo(() => products.find((p) => p.id === selectedId), [products, selectedId]);
  const bumpProduct = useMemo(() => products.find((p) => p.id === orderBump.productId), [products, orderBump.productId]);

  const isSelectedOut = !!(selectedProduct?.track_inventory && typeof selectedProduct?.inventory_quantity === 'number' && selectedProduct?.inventory_quantity <= 0);

  // Tracking state
  const [hasTrackedInitiateCheckout, setHasTrackedInitiateCheckout] = useState<boolean>(false);

  // Form state
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    shipping_address: '', shipping_city: '', shipping_area: '',
    shipping_country: '', shipping_state: '', shipping_postal_code: '',
    payment_method: 'cod' as 'cod' | 'bkash' | 'nagad' | 'eps' | 'ebpay', 
    payment_transaction_number: '',
    notes: '',
    accept_terms: false,
    custom_fields: {} as Record<string, any>,
    selectedShippingOption: '', // For custom shipping options
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default custom shipping option when product changes
  useEffect(() => {
    if (selectedProduct) {
      const productShippingConfig = (selectedProduct as any).shipping_config;
      if (productShippingConfig?.type === 'custom_options' && productShippingConfig?.customOptions?.length > 0) {
        const defaultOption = productShippingConfig.customOptions.find((opt: any) => opt.isDefault) || productShippingConfig.customOptions[0];
        if (defaultOption && !form.selectedShippingOption) {
          setForm(prev => ({ ...prev, selectedShippingOption: defaultOption.id }));
        }
      }
    }
  }, [selectedProduct?.id]);

  // Allowed payment methods derived from selected product (and optional order bump when checked)
  const [allowedMethods, setAllowedMethods] = useState<Array<'cod' | 'bkash' | 'nagad' | 'eps' | 'ebpay'>>(['cod','bkash','nagad','eps','ebpay']);
  useEffect(() => {
    let methods: string[] = ['cod','bkash','nagad','eps','ebpay'];
    if (selectedProduct?.allowed_payment_methods && selectedProduct.allowed_payment_methods.length > 0) {
      methods = methods.filter(m => (selectedProduct.allowed_payment_methods as string[]).includes(m));
    }
    if (orderBump.enabled && bumpChecked && bumpProduct?.allowed_payment_methods && bumpProduct.allowed_payment_methods.length > 0) {
      methods = methods.filter(m => (bumpProduct.allowed_payment_methods as string[]).includes(m));
    }
    // Intersect with store-level enabled gateways
    const storeAllowed: Record<string, boolean> = {
      cod: true,
      bkash: !!store?.settings?.bkash?.enabled,
      nagad: !!store?.settings?.nagad?.enabled,
      eps: !!store?.settings?.eps?.enabled,
      ebpay: !!store?.settings?.ebpay?.enabled,
    };
    methods = methods.filter((m) => (storeAllowed as any)[m]);
    if (methods.length === 0) methods = ['cod'];
    setAllowedMethods(methods as any);
    if (!methods.includes(form.payment_method)) {
      setForm(prev => ({ ...prev, payment_method: methods[0] as any }));
    }
  }, [selectedProduct?.id, bumpProduct?.id, bumpChecked, orderBump.enabled, store]);

  // Calculate subtotal for tracking (defined before useEffect)
  const trackingSubtotal = useMemo(() => {
    const main = selectedProduct ? Number(selectedProduct.price) * Math.max(1, quantity || 1) : 0;
    const bump = (orderBump.enabled && bumpChecked && bumpProduct) ? Number(bumpProduct.price) : 0;
    return main + bump;
  }, [selectedProduct, quantity, orderBump.enabled, bumpChecked, bumpProduct]);

  // Track InitiateCheckout event when component mounts and has configured products
  useEffect(() => {
    const sessionKey = `initiate_checkout_tracked_${element.id}`;
    const alreadyTracked = sessionStorage.getItem(sessionKey);
    
    if (!hasTrackedInitiateCheckout && !alreadyTracked && selectedProduct && store && pixels && trackingSubtotal > 0) {
      console.log('🛒 Tracking InitiateCheckout on inline checkout mount:', {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        value: trackingSubtotal,
        store: store.name,
        websiteId,
        funnelId
      });

      trackInitiateCheckout({
        value: trackingSubtotal,
        items: [{
          item_id: selectedProduct.id,
          item_name: selectedProduct.name,
          price: selectedProduct.price,
          quantity: quantity,
          item_category: (selectedProduct as any).category || 'General'
        }]
      });
      
      setHasTrackedInitiateCheckout(true);
      sessionStorage.setItem(sessionKey, 'true');
    } else if (!selectedProduct) {
      console.log('🛒 No product selected for inline checkout, skipping InitiateCheckout tracking');
    } else if (!store) {
      console.log('🛒 Store not loaded yet for inline checkout, skipping InitiateCheckout tracking');
    } else if (!pixels) {
      console.log('🛒 Pixels not configured for inline checkout, skipping InitiateCheckout tracking');
    } else if (alreadyTracked || hasTrackedInitiateCheckout) {
      console.log('🛒 InitiateCheckout already tracked for inline checkout this session');
    }
  }, [selectedProduct, store, pixels, trackingSubtotal, quantity, element.id, hasTrackedInitiateCheckout, trackInitiateCheckout, websiteId, funnelId]);

  // Styles
  const buttonStyles = (element.styles as any)?.checkoutButton || { responsive: { desktop: {}, mobile: {} } };
  const buttonCSS = generateResponsiveCSS(element.id, buttonStyles);
  const headerStyles = (element.styles as any)?.checkoutSectionHeader || { responsive: { desktop: {}, mobile: {} } };
  const headerCSS = generateResponsiveCSS(`${element.id}-section-header`, headerStyles);
  const backgrounds = (element.styles as any)?.checkoutBackgrounds || {};
  const formBorderWidth = Number((backgrounds as any)?.formBorderWidth || 0);
  const summaryBorderWidth = Number((backgrounds as any)?.summaryBorderWidth || 0);
  const buttonSize = (((element.styles as any)?.checkoutButtonSize) || 'default') as 'sm' | 'default' | 'lg' | 'xl';
  const buttonInline = useMemo(() => mergeResponsiveStyles({}, buttonStyles, deviceType as any), [buttonStyles, deviceType]);
  const headerInline = useMemo(() => mergeResponsiveStyles({}, headerStyles, deviceType as any), [headerStyles, deviceType]);

  // Shipping calculation using enhanced shipping
  const { websiteShipping } = useWebsiteShipping();

  // Track selected shipping option for website shipping
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);

  // Set default shipping option when website shipping is available
  useEffect(() => {
    if (websiteShipping?.enabled && !selectedShippingOption) {
      const options = getAvailableShippingOptions(websiteShipping);
      if (options.length > 0) {
        const defaultOption = options.find(opt => opt.type === 'rest_of_country') || options[0];
        setSelectedShippingOption(defaultOption);
        // Apply the default option to form fields
        applyShippingOptionToForm(defaultOption, websiteShipping, setForm);
      }
    }
  }, [websiteShipping, selectedShippingOption]);

  // Check if we have digital-only products
  const isDigitalOnlyCart = useMemo(() => {
    const isSelectedDigital = (selectedProduct as any)?.product_type === 'digital';
    const isBumpDigital = !orderBump.enabled || !bumpChecked || !bumpProduct || (bumpProduct as any)?.product_type === 'digital';
    return isSelectedDigital && isBumpDigital;
  }, [selectedProduct, orderBump.enabled, bumpChecked, bumpProduct]);

  // Calculate shipping cost using enhanced shipping calculation or custom options
  const shippingCalculation = useMemo(() => {
    if (!selectedProduct) {
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

    // Skip shipping for digital-only carts
    if (isDigitalOnlyCart) {
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

    // Check if selected product has custom shipping options
    const productShippingConfig = (selectedProduct as any).shipping_config;
    const hasCustomOptions = productShippingConfig?.type === 'custom_options' && productShippingConfig?.customOptions?.length > 0;

    if (hasCustomOptions) {
      // Handle custom shipping options
      const customOptions = productShippingConfig.customOptions;
      const selectedOption = form.selectedShippingOption ? 
        customOptions.find((opt: any) => opt.id === form.selectedShippingOption) :
        customOptions.find((opt: any) => opt.isDefault) || customOptions[0];

      let customShippingCost = selectedOption?.fee || 0;

      // Add bump shipping fee if enabled and bump is checked
      if (orderBump.enabled && bumpChecked && chargeShippingForBump) {
        customShippingCost += bumpShippingFee;
      }

      return {
        shippingCost: customShippingCost,
        isFreeShipping: customShippingCost === 0,
        breakdown: {
          baseFee: selectedOption?.fee || 0,
          weightFee: 0,
          productSpecificFees: (orderBump.enabled && bumpChecked && chargeShippingForBump) ? bumpShippingFee : 0,
          totalBeforeDiscount: customShippingCost,
          discount: 0,
        },
        customShipping: {
          selectedOption: selectedOption,
          availableOptions: customOptions
        }
      };
    }

    // Fall back to enhanced shipping calculation with website shipping options
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
    
    const address = {
      city: form.shipping_city,
      area: form.shipping_area,
      address: form.shipping_address,
      postal: form.shipping_postal_code
    };

    // Convert selected products to cart items format
    const cartItems: CartItem[] = [
      {
        id: selectedProduct.id,
        productId: selectedProduct.id,
        quantity: parseInt(String(quantity)) || 1,
        price: selectedProduct.price,
        weight_grams: (selectedProduct as any).weight_grams || 0,
        shipping_config: (selectedProduct as any).shipping_config,
      }
    ];

    // Add bump product if selected
    if (orderBump.enabled && bumpChecked && bumpProduct) {
      cartItems.push({
        id: bumpProduct.id,
        productId: bumpProduct.id,
        quantity: 1,
        price: bumpProduct.price,
        weight_grams: (bumpProduct as any).weight_grams || 0,
        shipping_config: (bumpProduct as any).shipping_config,
      });
    }

    const main = selectedProduct ? Number(selectedProduct.price) * Math.max(1, quantity || 1) : 0;
    const bump = (orderBump.enabled && bumpChecked && bumpProduct) ? Number(bumpProduct.price) : 0;
    const subtotal = main + bump;
    
    const result = computeOrderShipping(websiteShipping, cartItems, address, subtotal);
    
    // Add bump shipping fee if enabled and bump is checked
    if (orderBump.enabled && bumpChecked && chargeShippingForBump) {
      return {
        ...result,
        shippingCost: result.shippingCost + bumpShippingFee,
        isFreeShipping: (result.shippingCost + bumpShippingFee) === 0,
        breakdown: {
          ...result.breakdown,
          productSpecificFees: result.breakdown.productSpecificFees + bumpShippingFee,
          totalBeforeDiscount: result.breakdown.totalBeforeDiscount + bumpShippingFee,
        }
      };
    }
    
    return result;
  }, [websiteShipping, form, selectedProduct, bumpProduct, orderBump.enabled, bumpChecked, quantity, chargeShippingForBump, bumpShippingFee, selectedShippingOption]);

  const shippingCost = shippingCalculation.shippingCost;
  const subtotal = useMemo(() => {
    const main = selectedProduct ? Number(selectedProduct.price) * Math.max(1, quantity || 1) : 0;
    const bump = (orderBump.enabled && bumpChecked && bumpProduct) ? Number(bumpProduct.price) : 0;
    return main + bump;
  }, [selectedProduct, quantity, orderBump.enabled, bumpChecked, bumpProduct]);

  // Helper function to normalize Bangladesh phone numbers
  const normalizeBdPhone = (phone: string): string => {
    if (!phone) return '';
    // Remove all non-digits except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    // If starts with +88, keep it
    if (cleaned.startsWith('+88')) {
      return cleaned;
    }
    // If starts with 88, add +
    if (cleaned.startsWith('88')) {
      return '+' + cleaned;
    }
    // If starts with 01 (local format), add +88
    if (cleaned.startsWith('01')) {
      return '+88' + cleaned;
    }
    // If it's 11 digits starting with 1, assume it's missing the 0
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return '+880' + cleaned;
    }
    return cleaned;
  };

  const handleSubmit = async () => {
    if (!store || !selectedProduct) return;
    if (isSelectedOut) { toast.error('Selected product is out of stock'); return; }
    if (terms.enabled && terms.required && !form.accept_terms) {
      toast.error('Please accept the terms to continue');
      return;
    }

    setIsSubmitting(true);
    
    // Generate idempotency key for this submission
    const idempotencyKey = crypto.randomUUID();

    // Validate required fields
    const missing: string[] = [];
    const isEmpty = (v?: string) => !v || v.trim() === '';
    if (fields.fullName?.enabled && (fields.fullName?.required ?? true) && isEmpty(form.customer_name)) missing.push('Full Name');
    
    // Phone validation with normalization
    if (fields.phone?.enabled && (fields.phone?.required ?? true)) {
      if (isEmpty(form.customer_phone)) {
        missing.push('Phone');
      } else {
        const normalizedPhone = normalizeBdPhone(form.customer_phone);
        if (!normalizedPhone || normalizedPhone.length < 11) {
          setPhoneError('Please enter a valid phone number');
          return; // Stop form submission
        } else {
          // Update form with normalized phone and clear error
          setForm(prev => ({ ...prev, customer_phone: normalizedPhone }));
          setPhoneError('');
        }
      }
    }
    
    if (fields.email?.enabled && (fields.email?.required ?? false)) {
      const email = form.customer_email || '';
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (isEmpty(email) || !emailOk) missing.push('Valid Email');
    }
    if (!isDigitalOnlyCart && fields.address?.enabled && (fields.address?.required ?? true) && isEmpty(form.shipping_address)) missing.push('Address');
    if (!isDigitalOnlyCart && fields.city?.enabled && (fields.city?.required ?? true) && isEmpty(form.shipping_city)) missing.push('City');
    if (!isDigitalOnlyCart && fields.area?.enabled && (fields.area?.required ?? false) && isEmpty(form.shipping_area)) missing.push('Area');
    if (!isDigitalOnlyCart && fields.country?.enabled && (fields.country?.required ?? false) && isEmpty(form.shipping_country)) missing.push('Country');
    if (!isDigitalOnlyCart && fields.state?.enabled && (fields.state?.required ?? false) && isEmpty(form.shipping_state)) missing.push('State/Province');
    if (!isDigitalOnlyCart && fields.postalCode?.enabled && (fields.postalCode?.required ?? false) && isEmpty(form.shipping_postal_code)) missing.push('ZIP / Postal code');
    (customFields || []).filter((cf:any)=>cf.enabled && cf.required).forEach((cf:any)=>{ const v=(form.custom_fields as any)[cf.id]; if (!String(v ?? '').trim()) missing.push(cf.label || 'Custom field'); });
    
    // Validate transaction number for manual payments
    const hasBkashApi = !!(store?.settings?.bkash?.app_key && store?.settings?.bkash?.app_secret && store?.settings?.bkash?.username && store?.settings?.bkash?.password);
    const isBkashManual = !!(store?.settings?.bkash?.enabled && (store?.settings?.bkash?.mode === 'number' || !hasBkashApi) && store?.settings?.bkash?.number);
    const hasNagadApi = !!(store?.settings?.nagad?.merchant_id && store?.settings?.nagad?.public_key && store?.settings?.nagad?.private_key);
    const isNagadManual = !!(store?.settings?.nagad?.enabled && (store?.settings?.nagad?.mode === 'number' || !hasNagadApi) && store?.settings?.nagad?.number);
    const isManual = (form.payment_method === 'bkash' && isBkashManual) || (form.payment_method === 'nagad' && isNagadManual);
    
    if (isManual && !form.payment_transaction_number?.trim()) {
      missing.push('Transaction Number');
    }
    
    if (missing.length) { toast.error(`Please fill in: ${missing.join(', ')}`); return; }

  const total = subtotal + shippingCost;
    try {
      const hasBkashApi = !!(store?.settings?.bkash?.app_key && store?.settings?.bkash?.app_secret && store?.settings?.bkash?.username && store?.settings?.bkash?.password);
      const isBkashManual = !!(store?.settings?.bkash?.enabled && (store?.settings?.bkash?.mode === 'number' || !hasBkashApi) && store?.settings?.bkash?.number);
      const hasNagadApi = !!(store?.settings?.nagad?.merchant_id && store?.settings?.nagad?.public_key && store?.settings?.nagad?.private_key);
      const isNagadManual = !!(store?.settings?.nagad?.enabled && (store?.settings?.nagad?.mode === 'number' || !hasNagadApi) && store?.settings?.nagad?.number);
      const isManual = (form.payment_method === 'bkash' && isBkashManual) || (form.payment_method === 'nagad' && isNagadManual);

      // Determine funnel_id for the order - crucial for funnel analytics
      const orderFunnelId = funnelId || funnelStepData?.funnel_id || null;

      const orderData: any = {
        store_id: store.id,
        website_id: resolvedWebsiteId || null,
        funnel_id: orderFunnelId, // Ensure funnel_id is set for all orders from funnels
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        shipping_address: form.shipping_address,
        shipping_city: form.shipping_city,
        shipping_area: form.shipping_area,
        shipping_country: form.shipping_country,
        shipping_state: form.shipping_state,
        shipping_postal_code: form.shipping_postal_code,
        payment_method: form.payment_method,
        payment_transaction_number: form.payment_transaction_number,
        notes: form.notes,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        discount_amount: 0,
        total: total,
        status: form.payment_method === 'cod' ? 'pending' : ( isManual ? 'pending' : 'pending' ),
        custom_fields: (customFields || []).filter((cf:any)=>cf.enabled).map((cf:any)=>{ const value=(form.custom_fields as any)[cf.id]; if (value===undefined||value===null||value==='') return null; return { id: cf.id, label: cf.label || cf.id, value }; }).filter(Boolean),
        idempotency_key: idempotencyKey,
        // Save shipping method for custom options
        shipping_method: (() => {
          const productShippingConfig = (selectedProduct as any)?.shipping_config;
          if (productShippingConfig?.type === 'custom_options' && form.selectedShippingOption) {
            const selectedOption = productShippingConfig.customOptions?.find((opt: any) => opt.id === form.selectedShippingOption);
            return selectedOption ? `custom: ${selectedOption.label}` : 'standard';
          }
          return 'standard';
        })(),
      };

      const itemsPayload: any[] = [
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          product_sku: selectedProduct.sku,
          price: Number(selectedProduct.price),
          quantity: Math.max(1, quantity || 1),
          image: Array.isArray(selectedProduct.images) ? selectedProduct.images[0] : (selectedProduct.images || null),
          variation: null,
        }
      ];
      if (orderBump.enabled && bumpChecked && bumpProduct) {
        itemsPayload.push({
          product_id: bumpProduct.id,
          product_name: bumpProduct.name,
          product_sku: bumpProduct.sku,
          price: Number(bumpProduct.price),
          quantity: 1,
          image: Array.isArray(bumpProduct.images) ? bumpProduct.images[0] : (bumpProduct.images || null),
          variation: null,
        });
      }

      const { data, error } = await supabase.functions.invoke('create-order', {
        body: { order: orderData, items: itemsPayload, storeId: store.id }
      });
      if (error) throw error;
      const orderId: string | undefined = data?.order?.id;
      const accessToken = data?.order?.access_token;
      if (!orderId) throw new Error('Order was not created');

      if (form.payment_method === 'cod' || isManual) {
        // Track Purchase event for COD orders
        const trackingItems = itemsPayload.map(item => ({
          item_id: item.product_id,
          item_name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          item_category: undefined
        }));
        
        trackPurchase({
          transaction_id: orderId,
          value: total,
          items: trackingItems
        });
        
        // Clear InitiateCheckout tracking on successful order
        const sessionKey = `initiate_checkout_tracked_${element.id}`;
        sessionStorage.removeItem(sessionKey);
        setHasTrackedInitiateCheckout(false);
        
        toast.success(isManual ? 'Order placed! Please complete payment to the provided number.' : 'Order placed!');
        
        // Handle funnel step success redirect
        if (funnelStepData?.on_success_step_id) {
          try {
            // Fetch the next step details
            const { data: nextStep, error } = await supabase
              .from('funnel_steps')
              .select('slug, funnel_id')
              .eq('id', funnelStepData.on_success_step_id)
              .single();
              
            if (!error && nextStep?.slug) {
              // Environment-aware redirect to next step
              const isAppEnvironment = (
                window.location.hostname === 'localhost' || 
                window.location.hostname.includes('lovable.dev') ||
                window.location.hostname.includes('lovable.app') ||
                window.location.hostname.includes('lovableproject.com')
              );
              
              if (isAppEnvironment) {
                // App/sandbox: use funnel-aware paths
                const nextUrl = `/funnel/${funnelStepData.funnel_id}/${nextStep.slug}?orderId=${orderId}&ot=${accessToken}`;
                console.log(`Redirecting to success step (app): ${nextUrl}`);
                window.location.href = nextUrl;
                return;
              } else {
                // Custom domain: use clean paths
                const nextUrl = `/${nextStep.slug}?orderId=${orderId}&ot=${accessToken}`;
                console.log(`Redirecting to success step (custom domain): ${nextUrl}`);
                window.location.href = nextUrl;
                return;
              }
            } else {
              console.log('Next step not found, falling back to order confirmation');
            }
          } catch (error) {
            console.error('Error fetching next step:', error);
          }
        }
        
        // Fallback: Check element-level redirect URL
        if (successRedirectUrl && successRedirectUrl.trim()) {
          const redirectUrl = new URL(successRedirectUrl, window.location.origin);
          redirectUrl.searchParams.set('orderId', orderId);
          redirectUrl.searchParams.set('ot', accessToken || '');
          console.log(`Redirecting to element success URL: ${redirectUrl.toString()}`);
          window.location.href = redirectUrl.toString();
        } else {
          // Final fallback: order confirmation
          const confirmUrl = paths.orderConfirmation(orderId, accessToken);
          console.log(`Redirecting to order confirmation: ${confirmUrl}`);
          navigate(confirmUrl);
        }
      } else {
        // Store checkout data temporarily for live payments (EPS/EB Pay)
        // Include current step ID for funnel context
        sessionStorage.setItem('pending_checkout', JSON.stringify({
          orderData: {
            ...orderData,
            currentStepId: stepId  // ✅ Add current step ID for funnel context
          },
          itemsPayload,
          storeId: store.id,
          timestamp: Date.now()
        }));
        
        await initiatePayment(orderId, orderData.total, form.payment_method, accessToken);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiatePayment = async (orderId: string, amount: number, method: string, accessToken?: string) => {
    try {
      let response;
      switch (method) {
        case 'bkash':
          response = await supabase.functions.invoke('bkash-payment', { body: { orderId, amount, storeId: store!.id } });
          break;
        case 'nagad':
          response = await supabase.functions.invoke('nagad-payment', { body: { orderId, amount, storeId: store!.id } });
          break;
        case 'eps':
          response = await supabase.functions.invoke('eps-payment', { body: { orderId, amount, storeId: store!.id, customerData: { name: form.customer_name, email: form.customer_email, phone: form.customer_phone, address: form.shipping_address, city: form.shipping_city, country: form.shipping_country, state: form.shipping_state, postal_code: form.shipping_postal_code } } });
          break;
        case 'ebpay':
          response = await supabase.functions.invoke('ebpay-payment', { 
            body: { 
              orderId, 
              amount, 
              storeId: store!.id, 
              redirectOrigin: window.location.origin,
              customerData: { 
                name: form.customer_name, 
                email: form.customer_email, 
                phone: form.customer_phone, 
                address: form.shipping_address, 
                city: form.shipping_city, 
                country: form.shipping_country, 
                state: form.shipping_state, 
                postal_code: form.shipping_postal_code 
              } 
            } 
          });
          break;
        default:
          throw new Error('Invalid payment method');
      }
      if (response.error) throw new Error(response.error.message);
      const { paymentURL } = response.data;
      if (paymentURL) {
        window.location.href = paymentURL;
        navigate(paths.paymentProcessing(orderId) + (accessToken ? `&ot=${accessToken}` : ''));
      } else throw new Error('Payment URL not received');
    } catch (error) {
      console.error('Payment initiation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment';
      toast.error(errorMessage);
    }
  };

  // Calculate responsive padding for the checkout element using mergeResponsiveStyles
  const mergedStyles = mergeResponsiveStyles({}, element.styles, deviceType);
  
  const checkoutPadding = useMemo(() => ({
    paddingTop: mergedStyles.paddingTop || '0',
    paddingRight: mergedStyles.paddingRight || '0', 
    paddingBottom: mergedStyles.paddingBottom || '0',
    paddingLeft: mergedStyles.paddingLeft || '0'
  }), [mergedStyles.paddingTop, mergedStyles.paddingRight, mergedStyles.paddingBottom, mergedStyles.paddingLeft]);

  // Show preview placeholder when no store context is available (like in admin template editor)
  if (!store) {
    return (
      <div className="max-w-5xl mx-auto" style={checkoutPadding}>
        <Card className="border">
          <CardContent className="p-6 text-center space-y-4">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Inline Checkout Preview</h3>
              <p className="text-sm text-muted-foreground">
                This checkout element will display when connected to a store with products.
              </p>
              <p className="text-xs text-muted-foreground">
                {productIds.length > 0 
                  ? `Configured with ${productIds.length} product${productIds.length === 1 ? '' : 's'}`
                  : 'No products configured yet - use the Content panel to select products'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (productIds.length === 0) return <div className="text-center text-muted-foreground">Select products for this checkout in the Content panel.</div>;

  // Layout helpers for form
  const showFullName = !!fields.fullName?.enabled;
  const showPhone = !!fields.phone?.enabled;
  const infoGridCols = (showFullName && showPhone) ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1';
  const showCity = !!fields.city?.enabled;
  const showArea = !!fields.area?.enabled;
  const ship2GridCols = (showCity && showArea) ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1';
  const showCountry = !!fields.country?.enabled;
  const showState = !!fields.state?.enabled;
  const showPostal = !!fields.postalCode?.enabled;
  const ship3Count = [showCountry, showState, showPostal].filter(Boolean).length;
  let ship3GridCols = 'grid-cols-1';
  if (ship3Count >= 3) ship3GridCols = 'grid-cols-1 md:grid-cols-3';
  else if (ship3Count === 2) ship3GridCols = 'grid-cols-1 md:grid-cols-2';

  return (
    <div className="max-w-5xl mx-auto" style={{ backgroundColor: (backgrounds as any).containerBg || undefined, ...checkoutPadding }}>
        <Card className={formBorderWidth > 0 ? undefined : 'border-0'} style={{ backgroundColor: (backgrounds as any).formBg || undefined, borderColor: (backgrounds as any).formBorderColor || undefined, borderWidth: formBorderWidth || 0 }}>
          <CardContent className="p-4 md:p-6 space-y-6 w-full overflow-x-hidden" dir="auto">
            {/* Product chooser */}
            <section className="space-y-4">
              <h3 className={`mb-3 font-semibold text-xl element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>Select Product</h3>
              {allowSwitching && products.length > 1 ? (
                <div className="space-y-2">
                  {products.filter((p)=>productIds.includes(p.id)).map((p) => {
                    const isOut = p.track_inventory && typeof p.inventory_quantity === 'number' && p.inventory_quantity <= 0;
                    return (
                      <label key={p.id} className="flex items-start gap-3 border rounded p-3 w-full">
                        {Array.isArray(p.images) && p.images[0] && (
                           <StorefrontImage src={p.images[0]} alt={`${p.name} product`} className="w-12 h-12 object-cover rounded border flex-shrink-0" aspectRatio="1" />
                        )}
                        <input type="radio" name={`inline-product-${element.id}`} className="mt-1 flex-shrink-0" checked={selectedId === p.id} disabled={isOut} onChange={() => setSelectedId(p.id)} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium break-words whitespace-normal leading-snug text-sm md:text-base">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{isOut ? 'Out of stock' : formatCurrency(Number(p.price))}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  {selectedProduct && Array.isArray(selectedProduct.images) && selectedProduct.images[0] && (
                    <img src={selectedProduct.images[0]} alt={`${selectedProduct.name} product`} className="w-12 h-12 object-cover rounded border flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium break-words whitespace-normal leading-snug text-sm md:text-base">{selectedProduct?.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedProduct ? formatCurrency(Number(selectedProduct.price)) : ''}</div>
                  </div>
                </div>
              )}

              {showQuantity && (
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Quantity:</label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setQuantity((q)=>Math.max(1, (q||1)-1))} disabled={quantity<=1}>-</Button>
                    <span className="px-3 py-1 border rounded min-w-[50px] text-center">{quantity}</span>
                    <Button variant="outline" size="sm" onClick={() => setQuantity((q)=>Math.max(1, (q||1)+1))} disabled={isSelectedOut}>+</Button>
                  </div>
              </div>
            )}

            {/* Digital Product Info */}
            {sections.shipping && isDigitalOnlyCart && (
              <div className="space-y-4">
                <h3 className="font-semibold" style={headerInline}>Digital Delivery</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">
                    📧 Your digital products will be delivered instantly via email after payment confirmation.
                  </p>
                </div>
              </div>
            )}

            </section>

            {(sections.info || (sections.shipping && !isDigitalOnlyCart) || sections.payment || sections.summary) && <Separator />}

            {/* Info */}
            {sections.info && (
              <section className="space-y-4">
                <h3 className={`mb-3 font-semibold text-xl element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>{headings.info}</h3>
                <div className={`grid ${infoGridCols} gap-4`}>
                  {fields.fullName?.enabled && (
                    <Input 
                      placeholder={fields.fullName.placeholder} 
                      value={form.customer_name} 
                      onChange={e=>setForm(f=>({...f,customer_name:e.target.value}))} 
                      required={!!(fields.fullName?.enabled && (fields.fullName?.required ?? true))} 
                      aria-required={!!(fields.fullName?.enabled && (fields.fullName?.required ?? true))}
                      className="h-12 rounded-lg border-border bg-background px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    />
                  )}
                  {fields.phone?.enabled && (
                    <div className="space-y-2">
                      <Input 
                        placeholder={fields.phone.placeholder} 
                        value={form.customer_phone} 
                        onChange={(e) => {
                          setForm(f => ({ ...f, customer_phone: e.target.value }));
                          setPhoneError(''); // Clear error on input
                        }}
                        onBlur={(e) => {
                          if (fields.phone?.required && e.target.value.trim()) {
                            const normalized = normalizeBdPhone(e.target.value);
                            if (!normalized || normalized.length < 11) {
                              setPhoneError('Please enter a valid phone number');
                            }
                          }
                        }}
                        required={!!(fields.phone?.enabled && (fields.phone?.required ?? true))} 
                        aria-required={!!(fields.phone?.enabled && (fields.phone?.required ?? true))}
                        aria-invalid={!!phoneError}
                        aria-describedby={phoneError ? `phone-error-${element.id}` : undefined}
                        className={`h-12 rounded-lg border-border bg-background px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${phoneError ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}`}
                      />
                      {phoneError && (
                        <p id={`phone-error-${element.id}`} className="text-sm font-medium text-destructive" role="alert">
                          {phoneError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {fields.email?.enabled && (
                  <Input 
                    type="email" 
                    placeholder={fields.email.placeholder} 
                    value={form.customer_email} 
                    onChange={e=>setForm(f=>({...f,customer_email:e.target.value}))} 
                    required={!!(fields.email?.enabled && (fields.email?.required ?? false))} 
                    aria-required={!!(fields.email?.enabled && (fields.email?.required ?? false))}
                    className="h-12 rounded-lg border-border bg-background px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                )}
              </section>
            )}

            

            {/* Shipping */}
            {sections.shipping && !isDigitalOnlyCart && (
              <section className="space-y-4">
                <h3 className={`mb-3 font-semibold text-xl element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>{headings.shipping}</h3>
                {fields.address?.enabled && (
                  <Textarea 
                    placeholder={fields.address.placeholder} 
                    value={form.shipping_address} 
                    onChange={e=>setForm(f=>({...f,shipping_address:e.target.value}))} 
                    rows={3} 
                    required={!!(fields.address?.enabled && (fields.address?.required ?? true))} 
                    aria-required={!!(fields.address?.enabled && (fields.address?.required ?? true))}
                    className="min-h-[90px] rounded-lg border-border bg-background px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
                  />
                )}
                <div className={`grid ${ship2GridCols} gap-4`}>
                  {fields.city?.enabled && (
                    <Input 
                      placeholder={fields.city.placeholder} 
                      value={form.shipping_city} 
                      onChange={e=>setForm(f=>({...f,shipping_city:e.target.value}))} 
                      required={!!(fields.city?.enabled && (fields.city?.required ?? true))} 
                      aria-required={!!(fields.city?.enabled && (fields.city?.required ?? true))}
                      className="h-12 rounded-lg border-border bg-background px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    />
                  )}
                  {fields.area?.enabled && (
                    <Input 
                      placeholder={fields.area.placeholder} 
                      value={form.shipping_area} 
                      onChange={e=>setForm(f=>({...f,shipping_area:e.target.value}))} 
                      required={!!(fields.area?.enabled && (fields.area?.required ?? false))} 
                      aria-required={!!(fields.area?.enabled && (fields.area?.required ?? false))}
                      className="h-12 rounded-lg border-border bg-background px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    />
                  )}
                </div>
                <div className={`grid ${ship3GridCols} gap-4`}>
                  {fields.country?.enabled && (
                    <Input 
                      placeholder={fields.country.placeholder} 
                      value={form.shipping_country} 
                      onChange={e=>setForm(f=>({...f,shipping_country:e.target.value}))} 
                      required={!!(fields.country?.enabled && (fields.country?.required ?? false))} 
                      aria-required={!!(fields.country?.enabled && (fields.country?.required ?? false))}
                      className="h-12 rounded-lg border-border bg-background px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    />
                  )}
                  {fields.state?.enabled && (
                    <Input 
                      placeholder={fields.state.placeholder} 
                      value={form.shipping_state} 
                      onChange={e=>setForm(f=>({...f,shipping_state:e.target.value}))} 
                      required={!!(fields.state?.enabled && (fields.state?.required ?? false))} 
                      aria-required={!!(fields.state?.enabled && (fields.state?.required ?? false))}
                      className="h-12 rounded-lg border-border bg-background px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    />
                  )}
                  {fields.postalCode?.enabled && (
                    <Input 
                      placeholder={fields.postalCode.placeholder} 
                      value={form.shipping_postal_code} 
                      onChange={e=>setForm(f=>({...f,shipping_postal_code:e.target.value}))} 
                      required={!!(fields.postalCode?.enabled && (fields.postalCode?.required ?? false))} 
                      aria-required={!!(fields.postalCode?.enabled && (fields.postalCode?.required ?? false))}
                      className="h-12 rounded-lg border-border bg-background px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    />
                  )}
                </div>

                {/* Shipping Options */}
                {(() => {
                  const productShippingConfig = (selectedProduct as any)?.shipping_config;
                  const hasCustomOptions = productShippingConfig?.type === 'custom_options' && productShippingConfig?.customOptions?.length > 0;
                  
                  // Show custom product options if available
                  if (hasCustomOptions) {
                    const customOptions = productShippingConfig.customOptions;
                    
                    return (
                      <div className="space-y-3">
                        <label className="text-sm font-medium">Shipping Options</label>
                        <div className="space-y-2">
                          {customOptions.map((option: any) => (
                            <label key={option.id} className="flex items-start gap-3 border rounded p-3 cursor-pointer hover:bg-muted/50">
                              <input
                                type="radio"
                                name={`shipping-option-${element.id}`}
                                value={option.id}
                                checked={form.selectedShippingOption === option.id}
                                onChange={(e) => setForm(prev => ({ ...prev, selectedShippingOption: e.target.value }))}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">{option.label}</span>
                                  <span className="font-semibold text-sm">{formatCurrency(option.fee)}</span>
                                </div>
                                {option.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  
                  // Show website shipping options if enabled and no custom product options
                  if (websiteShipping?.enabled) {
                    return (
                      <ShippingOptionsPicker
                        settings={websiteShipping}
                        selectedOptionId={selectedShippingOption?.id}
                        onOptionSelect={(option) => setSelectedShippingOption(option)}
                        setForm={setForm}
                        className="mt-4"
                      />
                    );
                  }
                  
                  return null;
                })()}

                {customFields?.length > 0 && (
                  <div className="space-y-2">
                    {customFields.filter((cf:any)=>cf.enabled).map((cf:any) => (
                      <div key={cf.id}>
                        {cf.type === 'textarea' ? (
                          <Textarea placeholder={cf.placeholder || cf.label} value={(form.custom_fields as any)[cf.id] || ''} onChange={(e)=>setForm(f=>({...f, custom_fields: { ...f.custom_fields, [cf.id]: e.target.value }}))} required={!!cf.required} aria-required={!!cf.required} />
                        ) : (
                          <Input type={cf.type || 'text'} placeholder={cf.placeholder || cf.label} value={(form.custom_fields as any)[cf.id] || ''} onChange={(e)=>setForm(f=>({...f, custom_fields: { ...f.custom_fields, [cf.id]: e.target.value }}))} required={!!cf.required} aria-required={!!cf.required} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Separator between sections */}
            {((sections.info && sections.payment && isDigitalOnlyCart) || (sections.shipping && !isDigitalOnlyCart && sections.payment)) && <Separator className="my-4" />}

            {/* Payment */}
            {sections.payment && (
              <section className="space-y-4">
                <h3 className={`mb-3 font-semibold element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>{headings.payment}</h3>
                <Select value={form.payment_method} onValueChange={(v:any)=>setForm(f=>({...f,payment_method:v}))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    {allowedMethods.includes('cod') && (<SelectItem value="cod">Cash on Delivery</SelectItem>)}
                    {allowedMethods.includes('bkash') && (<SelectItem value="bkash">bKash</SelectItem>)}
                    {allowedMethods.includes('nagad') && (<SelectItem value="nagad">Nagad</SelectItem>)}
                    {allowedMethods.includes('eps') && (<SelectItem value="eps">Bank/Card/MFS (EPS)</SelectItem>)}
                    {allowedMethods.includes('ebpay') && (<SelectItem value="ebpay">EB Pay Gateway</SelectItem>)}
                  </SelectContent>
                </Select>

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
                
              </section>
            )}

            {orderBump.enabled && bumpProduct && (
              <section className="space-y-3">
                <div className="border border-dashed rounded-md overflow-hidden" style={{ borderColor: 'hsl(var(--warning-border))' }}>
                  <div className="px-3 py-2" style={{ backgroundColor: 'hsl(var(--warning-light))' }}>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={bumpChecked} onChange={(e)=>setBumpChecked(e.target.checked)} />
                      <span className="text-sm font-semibold" style={{ color: 'hsl(var(--success))' }}>{orderBump.label || 'Add this to my order'}</span>
                    </label>
                  </div>
                  <div className="p-3 flex items-start gap-3">
                    {Array.isArray(bumpProduct.images) && bumpProduct.images[0] && (
                      <img src={bumpProduct.images[0]} alt={`${bumpProduct.name} product`} className="w-12 h-12 object-cover rounded border" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium break-words">{bumpProduct.name} · {formatCurrency(Number(bumpProduct.price))}</div>
                      {orderBump.description && (
                        <p className="text-xs text-muted-foreground mt-1 break-words">{orderBump.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {sections.summary && (
              <section className="space-y-3">
                <h3 className={`mb-3 font-semibold element-${element.id}-section-header`} style={headerInline as React.CSSProperties}>{headings.summary}</h3>
                <div className="rounded-md p-4" style={{ backgroundColor: (backgrounds as any).summaryBg || undefined, borderColor: (backgrounds as any).summaryBorderColor || undefined, borderWidth: summaryBorderWidth || 0, borderStyle: summaryBorderWidth ? 'solid' as any : undefined }}>
                  <div className="space-y-2">
                    {selectedProduct && (
                      <div className={`grid items-center gap-3 ${showItemImages && (Array.isArray(selectedProduct.images) && selectedProduct.images[0]) ? 'grid-cols-[auto_1fr_auto]' : 'grid-cols-[1fr_auto]'}`}>
                        {showItemImages && Array.isArray(selectedProduct.images) && selectedProduct.images[0] && (
                          <img src={selectedProduct.images[0]} alt={`${selectedProduct.name} product`} className="w-10 h-10 object-cover rounded border" />
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium break-words">{selectedProduct.name}</div>
                          <div className="text-xs text-muted-foreground">× {Math.max(1, quantity || 1)}</div>
                        </div>
                        <div className="text-sm font-medium shrink-0 whitespace-nowrap text-right">{formatCurrency(Number(selectedProduct.price) * Math.max(1, quantity || 1))}</div>
                      </div>
                    )}
                    {orderBump.enabled && bumpChecked && bumpProduct && (
                      <div className={`grid items-center gap-3 ${showItemImages && (Array.isArray(bumpProduct.images) && bumpProduct.images[0]) ? 'grid-cols-[auto_1fr_auto]' : 'grid-cols-[1fr_auto]'}`}>
                        {showItemImages && Array.isArray(bumpProduct.images) && bumpProduct.images[0] && (
                          <img src={bumpProduct.images[0]} alt={`${bumpProduct.name} product`} className="w-10 h-10 object-cover rounded border" />
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium break-words">{bumpProduct.name}</div>
                          <div className="text-xs text-muted-foreground">× 1</div>
                        </div>
                        <div className="text-sm font-medium shrink-0 whitespace-nowrap text-right">{formatCurrency(Number(bumpProduct.price))}</div>
                      </div>
                    )}
                  </div>
                  <Separator className="my-3" />
                  <div className="flex flex-wrap items-center justify-between gap-2 min-w-0"><span className="truncate">Subtotal</span><span className="font-semibold shrink-0 whitespace-nowrap text-right">{formatCurrency(subtotal)}</span></div>
                  <div className="flex flex-wrap items-center justify-between gap-2 min-w-0"><span className="truncate">Shipping</span><span className="font-semibold shrink-0 whitespace-nowrap text-right">{formatCurrency(shippingCost)}</span></div>
                  <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 font-bold"><span className="truncate">Total</span><span className="shrink-0 whitespace-nowrap text-right">{formatCurrency(subtotal + shippingCost)}</span></div>

                  <Button size={buttonSize as any} className={`w-full mt-2 element-${element.id}`} style={buttonInline as React.CSSProperties} onClick={handleSubmit} disabled={!selectedProduct || isSelectedOut || isSubmitting}>
                    {isSubmitting ? 'Processing...' : (isSelectedOut ? 'Out of Stock' : buttonLabel)}
                  </Button>

                  {terms.enabled && (
                    <label className="flex items-center gap-2 text-sm mt-2">
                      <input type="checkbox" checked={form.accept_terms} onChange={(e)=>setForm(f=>({...f, accept_terms: e.target.checked}))} />
                      <span>
                        {terms.label} {terms.url && (<a href={terms.url} target="_blank" rel="noreferrer" className="underline">Read</a>)}
                      </span>
                    </label>
                  )}

                  {trust.enabled && trust.imageUrl && (
                    <div className="pt-2">
                      <img src={trust.imageUrl} alt={trust.alt || 'Secure checkout'} className="w-full h-auto object-contain" loading="lazy" />
                    </div>
                  )}
                </div>
              </section>
            )}
          </CardContent>
        </Card>
      </div>
  );
};

export const registerInlineCheckoutElements = () => {
  elementRegistry.register({
    id: 'checkout-inline',
    name: 'Checkout (Inline)',
    category: 'ecommerce',
    icon: CreditCard,
    component: InlineCheckoutElement,
    defaultContent: {
      productIds: [],
      defaultProductId: '',
      allowSwitching: true,
      showQuantity: true,
      orderBump: { enabled: false, productId: '', label: 'Add this to my order', description: '', prechecked: false },
      sections: { info: true, shipping: true, payment: true, summary: true },
      headings: { info: 'Customer Information', shipping: 'Shipping', payment: 'Payment', summary: 'Order Summary' },
      placeOrderLabel: 'Place Order',
      showItemImages: true,
      fields: {
        fullName: { enabled: true, required: true, placeholder: 'Full Name' },
        phone: { enabled: true, required: true, placeholder: 'Phone Number' },
        email: { enabled: true, required: false, placeholder: 'Email Address' },
        address: { enabled: true, required: true, placeholder: 'Street address' },
        city: { enabled: true, required: true, placeholder: 'City' },
        area: { enabled: true, required: false, placeholder: 'Area' },
        country: { enabled: true, required: false, placeholder: 'Country' },
        state: { enabled: true, required: false, placeholder: 'State/Province' },
        postalCode: { enabled: true, required: false, placeholder: 'ZIP / Postal code' },
      },
      customFields: [],
      terms: { enabled: false, required: true, label: 'I agree to the Terms & Conditions', url: '/terms' },
      trustBadge: { enabled: false, imageUrl: '', alt: 'Secure checkout' },
    },
    description: 'Per-page inline checkout with product selection and optional order bump.'
  });
};
