import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useEcomPaths } from '@/lib/pathResolver';
import { CoursePaymentProcessing } from '@/components/course/CoursePaymentProcessing';
import { usePixelTracking } from '@/hooks/usePixelTracking';

export const PaymentProcessing: React.FC = () => {
  const { slug, websiteId, websiteSlug, orderId: orderIdParam } = useParams<{ slug?: string; websiteId?: string; websiteSlug?: string; orderId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { store, loadStore, loadStoreById } = useStore();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [isCoursePayment, setIsCoursePayment] = useState<boolean | null>(null);
  const [funnelContext, setFunnelContext] = useState<{
    isFunnelCheckout: boolean;
    funnelId?: string;
    currentStepId?: string;
  } | null>(null);
  const [pixelConfig, setPixelConfig] = useState<{
    facebook_pixel_id?: string;
    google_analytics_id?: string;
    google_ads_id?: string;
  } | undefined>(undefined);
  const paths = useEcomPaths();
  
  // Initialize pixel tracking hook (must be called unconditionally)
  const { trackPurchase } = usePixelTracking(pixelConfig, store?.id, websiteId, funnelContext?.funnelId);
  const orderId = orderIdParam || searchParams.get('orderId') || '';
  const tempId = searchParams.get('tempId') || '';
  const paymentMethod = searchParams.get('pm') || '';
  
  // Improved website context detection - check URL params or if we're on a custom domain route
  const isWebsiteContext = Boolean(websiteId || websiteSlug || (window.location.hostname !== 'localhost' && window.location.hostname !== 'ecombuildr.com'));
  
  // Get status from URL - this takes priority over database status
  const urlStatus = searchParams.get('status');
  const [statusUpdated, setStatusUpdated] = useState(false);
useEffect(() => {
  if (slug) {
    loadStore(slug);
  } else if (websiteId) {
    (async () => {
      const { data: website } = await supabase
        .from('websites')
        .select('store_id')
        .eq('id', websiteId)
        .single();
      if (website?.store_id) {
        await loadStoreById(website.store_id);
      }
    })();
  }
}, [slug, websiteId, loadStore, loadStoreById]);


  useEffect(() => {
    const checkIfCoursePayment = async () => {
      const checkId = tempId || orderId;
      if (!checkId) {
        setIsCoursePayment(false);
        return;
      }
      try {
        console.log('[PaymentProcessing] checking course payment via edge function', { checkId });
        const { data, error } = await supabase.functions.invoke('get-course-order-public', {
          body: { orderId: checkId }
        });
        if (error) {
          console.warn('[PaymentProcessing] get-course-order-public error', error);
          setIsCoursePayment(false);
          return;
        }
        const hasCourseOrder = Boolean(data?.order);
        console.log('[PaymentProcessing] course payment detected?', { hasCourseOrder });
        setIsCoursePayment(hasCourseOrder);
      } catch (err) {
        console.error('Error checking course payment:', err);
        setIsCoursePayment(false);
      }
    };

    checkIfCoursePayment();
  }, [tempId, orderId]);

  useEffect(() => {
    if (store && isCoursePayment === false) {
      if (tempId && (urlStatus === 'success' || urlStatus === 'completed')) {
        handleDeferredOrderCreation();
      } else if (tempId && (urlStatus === 'failed' || urlStatus === 'cancelled')) {
        // Handle failed/cancelled deferred payments immediately
        handleFailedDeferredPayment();
      } else if (orderId) {
        fetchOrder();
      } else if (tempId) {
        // If we have tempId but no status yet, show loading
        setLoading(false);
      }
    }
  }, [orderId, tempId, urlStatus, store, isCoursePayment]);

  // Auto-update order status if URL indicates failure/cancellation (for orders fetched via orderId)
  useEffect(() => {
    if (order && orderId && (urlStatus === 'failed' || urlStatus === 'cancelled') && !statusUpdated) {
      updateOrderStatusToCancelled();
    }
  }, [order, orderId, urlStatus, statusUpdated]);

  const handleFailedDeferredPayment = async () => {
    // Read checkout data BEFORE clearing it to preserve funnel context
    const pendingCheckout = sessionStorage.getItem('pending_checkout');
    let funnelContextData = null;
    
    if (pendingCheckout) {
      try {
        const checkoutData = JSON.parse(pendingCheckout);
        if (checkoutData.orderData?.isFunnelCheckout) {
          funnelContextData = {
            isFunnelCheckout: true,
            funnelId: checkoutData.orderData.funnelId,
            currentStepId: checkoutData.orderData.currentStepId
          };
          console.log('PaymentProcessing: Preserved funnel context for failed payment:', funnelContextData);
        }
      } catch (e) {
        console.error('Error parsing pending checkout:', e);
      }
    }
    
    // Store funnel context for UI
    setFunnelContext(funnelContextData);
    
    // Clear any stored checkout data since payment failed
    sessionStorage.removeItem('pending_checkout');
    
    // ✅ Update the real order in the database (tempId is the real orderId)
    if (tempId && store) {
      const orderStatus = urlStatus === 'cancelled' ? 'cancelled' : 'payment_failed';
      console.log('PaymentProcessing: Updating order status to', orderStatus, 'for order', tempId);
      
      try {
        const { data: updatedOrder, error: updateError } = await supabase
          .from('orders')
          .update({ 
            status: orderStatus as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', tempId)
          .eq('store_id', store.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('PaymentProcessing: Error updating order status:', updateError);
          // Fall back to mock order if update fails
          const mockOrder = {
            id: tempId,
            order_number: searchParams.get('transactionId') || tempId,
            payment_method: paymentMethod,
            total: parseFloat(searchParams.get('paymentAmount') || '0'),
            status: orderStatus,
            customer_name: '',
            created_at: new Date().toISOString()
          };
          setOrder(mockOrder);
        } else if (updatedOrder) {
          console.log('PaymentProcessing: ✅ Order status updated successfully:', updatedOrder);
          setOrder(updatedOrder);
        }
      } catch (error) {
        console.error('PaymentProcessing: Exception updating order status:', error);
        // Fall back to mock order if update fails
        const mockOrder = {
          id: tempId,
          order_number: searchParams.get('transactionId') || tempId,
          payment_method: paymentMethod,
          total: parseFloat(searchParams.get('paymentAmount') || '0'),
          status: orderStatus,
          customer_name: '',
          created_at: new Date().toISOString()
        };
        setOrder(mockOrder);
      }
    } else {
      // If no tempId or store, create a mock order object for display purposes
      const mockOrder = {
        id: tempId || '',
        order_number: searchParams.get('transactionId') || tempId || '',
        payment_method: paymentMethod,
        total: parseFloat(searchParams.get('paymentAmount') || '0'),
        status: urlStatus === 'cancelled' ? 'cancelled' : 'payment_failed',
        customer_name: '',
        created_at: new Date().toISOString()
      };
      setOrder(mockOrder);
    }
    
    setLoading(false);
  };

  const handleDeferredOrderCreation = async () => {
    if (!tempId || !store) return;

    setCreatingOrder(true);
    try {
      // Get stored checkout data
      const pendingCheckout = sessionStorage.getItem('pending_checkout');
      if (!pendingCheckout) {
        toast.error('Checkout data not found. Please try again.');
        setLoading(false);
        return;
      }

      const checkoutData = JSON.parse(pendingCheckout);
      
      // ✅ DETECT FUNNEL CONTEXT
      const isFunnelCheckout = checkoutData.orderData?.isFunnelCheckout;
      const funnelId = checkoutData.orderData?.funnelId;
      const currentStepId = checkoutData.orderData?.currentStepId;
      
      console.log('PaymentProcessing: Detected checkout context', {
        isFunnelCheckout,
        funnelId,
        currentStepId,
        isWebsiteContext,
        tempId
      });
      
      // Clean orderData to remove funnel-specific fields that might cause database constraint violations
      const cleanOrderData = {
        store_id: checkoutData.orderData.store_id,
        customer_name: checkoutData.orderData.customer_name || 'N/A',
        customer_email: checkoutData.orderData.customer_email,
        customer_phone: checkoutData.orderData.customer_phone || 'N/A',
        shipping_address: checkoutData.orderData.shipping_address || 'N/A',
        shipping_city: checkoutData.orderData.shipping_city,
        shipping_state: checkoutData.orderData.shipping_state,
        shipping_postal_code: checkoutData.orderData.shipping_postal_code,
        shipping_country: checkoutData.orderData.shipping_country,
        shipping_method: checkoutData.orderData.shipping_method || 'standard',
        shipping_cost: checkoutData.orderData.shipping_cost || 0,
        subtotal: checkoutData.orderData.subtotal,
        discount_amount: checkoutData.orderData.discount_amount || 0,
        total: checkoutData.orderData.total,
        payment_method: checkoutData.orderData.payment_method,
        // Status will be set by create-order-on-payment-success based on product types
        notes: checkoutData.orderData.notes || '',
        payment_transaction_number: checkoutData.orderData.payment_transaction_number || '',
        website_id: checkoutData.orderData.website_id,
        // ✅ Preserve original idempotency_key to prevent duplicate orders
        idempotency_key: checkoutData.orderData.idempotency_key || crypto.randomUUID(),
        // ✅ Set funnel_id directly on the order (not just in custom_fields)
        funnel_id: checkoutData.orderData.funnelId || checkoutData.orderData.funnel_id || null,
        // Store additional funnel context in custom_fields
        custom_fields: {
          ...(checkoutData.orderData.custom_fields || {}),
          funnelId: checkoutData.orderData.funnelId,
          currentStepId: checkoutData.orderData.currentStepId,
          isFunnelCheckout: checkoutData.orderData.isFunnelCheckout
        }
      };
      
      console.log('PaymentProcessing: About to create order with data:', {
        originalOrderData: checkoutData.orderData,
        cleanOrderData: cleanOrderData,
        itemsPayload: checkoutData.itemsPayload,
        storeId: store.id,
        tempId: tempId,
        paymentMethod: paymentMethod
      });
      
      // Create order now that payment is successful
      const { data, error } = await supabase.functions.invoke('create-order-on-payment-success', {
        body: {
          orderData: cleanOrderData,
          itemsData: checkoutData.itemsPayload,
          storeId: store.id,
          paymentVerified: true,
          paymentDetails: {
            method: paymentMethod,
            tempId: tempId,
            verifiedAt: new Date().toISOString(),
            transactionId: searchParams.get('transactionId') || undefined,
            paymentMethod: searchParams.get('paymentMethod') || undefined,
            paymentAmount: searchParams.get('paymentAmount') || undefined,
            paymentFee: searchParams.get('paymentFee') || undefined
          }
        }
      });

      if (error) {
        console.error('PaymentProcessing: create-order-on-payment-success error:', error);
        throw error;
      }

      if (data?.success && data?.order) {
        // Clear stored checkout data
        sessionStorage.removeItem('pending_checkout');
        
        // Clear cart after successful order creation
        clearCart();
        
        // ✅ TRACK PURCHASE EVENT FOR DEFERRED PAYMENTS
        // Fetch funnel pixel configuration if this is a funnel checkout
        if (isFunnelCheckout && funnelId) {
          try {
            // Update funnelContext state FIRST so the hook has the correct funnelId
            setFunnelContext({
              isFunnelCheckout: true,
              funnelId: funnelId,
              currentStepId: currentStepId
            });
            
            const { data: funnelData } = await supabase
              .from('funnels')
              .select('settings')
              .eq('id', funnelId)
              .single();
            
            if (funnelData?.settings) {
              const settings = funnelData.settings as any;
              const funnelPixels = {
                facebook_pixel_id: settings?.facebook_pixel_id || undefined,
                google_analytics_id: settings?.google_analytics_id || undefined,
                google_ads_id: settings?.google_ads_id || undefined,
              };
              
              // Update pixel config state
              setPixelConfig(funnelPixels);
              
              // Fetch order items for tracking
              const { data: orderItems, error: itemsError } = await supabase
                .from('order_items')
                .select('product_id, product_name, price, quantity')
                .eq('order_id', data.order.id);
              
              if (!itemsError && orderItems && orderItems.length > 0) {
                // Create tracking items
                const trackingItems = orderItems.map(item => ({
                  item_id: item.product_id,
                  item_name: item.product_name,
                  price: item.price,
                  quantity: item.quantity,
                }));
                
                // Track purchase event directly using window.fbq if available
                if (window.fbq && funnelPixels.facebook_pixel_id) {
                  try {
                    const eventData = {
                      content_ids: trackingItems.map(item => item.item_id),
                      content_type: 'product',
                      value: data.order.total,
                      currency: 'BDT',
                      contents: trackingItems.map(item => ({
                        id: item.item_id,
                        quantity: item.quantity,
                      })),
                    };
                    window.fbq('track', 'Purchase', eventData);
                    console.log('PaymentProcessing: Facebook Purchase event tracked:', {
                      orderId: data.order.id,
                      total: data.order.total,
                      itemsCount: orderItems.length,
                      funnelId
                    });
                  } catch (error) {
                    console.error('PaymentProcessing: Error tracking Facebook Purchase:', error);
                  }
                }
                
                // Track with Google Analytics if configured
                if ((funnelPixels.google_analytics_id || funnelPixels.google_ads_id) && window.gtag) {
                  try {
                    window.gtag('event', 'purchase', {
                      transaction_id: data.order.id,
                      currency: 'BDT',
                      value: data.order.total,
                      items: trackingItems,
                    });
                    console.log('PaymentProcessing: Google Analytics Purchase event tracked');
                  } catch (error) {
                    console.error('PaymentProcessing: Error tracking Google Purchase:', error);
                  }
                }
                
                // Store purchase event directly in database with funnel_id
                // This ensures funnel_id is stored correctly for funnel checkout purchases
                try {
                  let sessionId = sessionStorage.getItem('session_id');
                  if (!sessionId) {
                    sessionId = crypto.randomUUID();
                    sessionStorage.setItem('session_id', sessionId);
                  }
                  
                  const eventData = {
                    content_ids: trackingItems.map(item => item.item_id),
                    content_type: 'product',
                    value: data.order.total,
                    currency: 'BDT',
                    contents: trackingItems.map(item => ({
                      id: item.item_id,
                      quantity: item.quantity,
                    })),
                    _providers: {
                      facebook: {
                        configured: !!funnelPixels.facebook_pixel_id,
                        attempted: !!window.fbq && !!funnelPixels.facebook_pixel_id,
                        success: !!window.fbq && !!funnelPixels.facebook_pixel_id
                      },
                      google: {
                        configured: !!(funnelPixels.google_analytics_id || funnelPixels.google_ads_id),
                        attempted: !!(window.gtag && (funnelPixels.google_analytics_id || funnelPixels.google_ads_id)),
                        success: !!(window.gtag && (funnelPixels.google_analytics_id || funnelPixels.google_ads_id))
                      }
                    },
                    funnel_id: funnelId // ✅ Explicitly include funnel_id in event_data
                  };
                  
                  await supabase.from('pixel_events').insert({
                    store_id: store.id,
                    website_id: websiteId || null,
                    event_type: 'Purchase',
                    event_data: eventData,
                    session_id: sessionId,
                    page_url: window.location.href,
                    referrer: document.referrer || null,
                    utm_source: new URLSearchParams(window.location.search).get('utm_source'),
                    utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
                    utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
                    utm_term: new URLSearchParams(window.location.search).get('utm_term'),
                    utm_content: new URLSearchParams(window.location.search).get('utm_content'),
                    user_agent: navigator.userAgent,
                  });
                  
                  console.log('PaymentProcessing: Purchase event stored in database with funnel_id:', funnelId);
                } catch (dbError) {
                  console.error('PaymentProcessing: Error storing purchase event in database:', dbError);
                  // Fallback: use hook-based tracking if direct insert fails
                  trackPurchase({
                    transaction_id: data.order.id,
                    value: data.order.total,
                    items: trackingItems,
                  });
                }
                
                // Store tracking flag to prevent duplicate tracking on redirect
                sessionStorage.setItem('purchase_tracked_' + data.order.id, 'true');
              }
            }
          } catch (error) {
            console.error('PaymentProcessing: Error tracking purchase event:', error);
            // Don't block order creation if tracking fails
          }
        }
        
        // Add small delay to ensure database storage initiates before redirect
        try {
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (error) {
          // Don't block redirect if delay fails
          console.error('PaymentProcessing: Error in delay before redirect:', error);
        }
        
        // ✅ CONDITIONAL REDIRECT LOGIC
        if (isFunnelCheckout && funnelId && currentStepId) {
          // ✅ FUNNEL CHECKOUT: Redirect to next funnel step
          try {
            console.log('PaymentProcessing: Attempting funnel redirect...');
            
            // Find the current funnel step
            const { data: currentStep, error: stepError } = await supabase
              .from('funnel_steps')
              .select('id, on_success_step_id, on_success_custom_url, funnel_id')
              .eq('id', currentStepId)
              .single();
            
            if (!stepError && currentStep) {
              const newOrderToken = data.order.access_token;
              
              // Priority: Custom URL first, then step ID
              if (currentStep.on_success_custom_url && currentStep.on_success_custom_url.trim()) {
                // Custom URL takes priority
                try {
                  const customUrl = new URL(currentStep.on_success_custom_url, window.location.origin);
                  customUrl.searchParams.set('orderId', data.order.id);
                  customUrl.searchParams.set('ot', newOrderToken);
                  console.log(`PaymentProcessing: Redirecting to custom success URL: ${customUrl.toString()}`);
                  window.location.href = customUrl.toString();
                  return;
                } catch (error) {
                  console.error('PaymentProcessing: Error parsing custom URL:', error);
                  // Fall through to step ID check if URL parsing fails
                }
              } else if (currentStep.on_success_step_id) {
                // Fallback to step ID if no custom URL
              // Get the next step details
              const { data: nextStep, error: nextStepError } = await supabase
                .from('funnel_steps')
                .select('slug, funnel_id')
                .eq('id', currentStep.on_success_step_id)
                .single();
              
              if (!nextStepError && nextStep?.slug) {
                // Environment-aware redirect to next step
                const isAppEnvironment = (
                  window.location.hostname === 'localhost' || 
                  window.location.hostname === 'ecombuildr.com' ||
                  window.location.hostname === 'ecombuildr.com' ||
                  window.location.hostname === 'ecombuildr.com' ||
                  window.location.hostname === 'ecombuildr.com'
                );
                
                if (isAppEnvironment) {
                  // App/sandbox: use funnel-aware paths
                  const nextUrl = `/funnel/${funnelId}/${nextStep.slug}?orderId=${data.order.id}&ot=${newOrderToken}`;
                    console.log(`PaymentProcessing: Funnel redirect (app): ${nextUrl}`);
                  window.location.href = nextUrl;
                  return;
                } else {
                  // Custom domain: use clean paths
                  const nextUrl = `/${nextStep.slug}?orderId=${data.order.id}&ot=${newOrderToken}`;
                    console.log(`PaymentProcessing: Funnel redirect (custom domain): ${nextUrl}`);
                  window.location.href = nextUrl;
                  return;
                }
              } else {
                console.log('PaymentProcessing: Next step not found for funnel checkout');
              }
            } else {
              console.log('PaymentProcessing: Current step not found or no next step configured');
                // Fallback: redirect to order confirmation if no funnel redirect configured
                const newOrderToken = data.order.access_token;
                toast.success('Order created successfully!');
                window.location.href = paths.orderConfirmation(data.order.id, newOrderToken);
                return;
              }
            } else {
              console.log('PaymentProcessing: Current step not found or no next step configured');
              // Fallback: redirect to order confirmation if current step not found
              const newOrderToken = data.order.access_token;
              toast.success('Order created successfully!');
              window.location.href = paths.orderConfirmation(data.order.id, newOrderToken);
              return;
            }
          } catch (error) {
            console.error('PaymentProcessing: Error in funnel redirect:', error);
            // Fall through to generic order confirmation
          }
        }
        
        // ✅ WEBSITE CHECKOUT: Navigate to order confirmation (existing behavior)
        const newOrderToken = data.order.access_token;
        toast.success('Order created successfully!');
        window.location.href = paths.orderConfirmation(data.order.id, newOrderToken);
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      console.error('Error creating deferred order:', error);
      toast.error('Failed to create order. Please contact support.');
    } finally {
      setCreatingOrder(false);
      setLoading(false);
    }
  };

  const updateOrderStatusToCancelled = async () => {
    if (!order || !orderId || !store) return;
    
    setStatusUpdated(true);
    const orderStatus = urlStatus === 'cancelled' ? 'cancelled' : 'payment_failed';
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: orderStatus as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('store_id', store.id);
      
      if (!error) {
        setOrder(prev => ({ ...prev, status: orderStatus }));
        console.log('PaymentProcessing: ✅ Order status updated to', orderStatus);
      } else {
        console.error('PaymentProcessing: Error updating order status:', error);
      }
    } catch (error) {
      console.error('PaymentProcessing: Exception updating order status:', error);
    }
  };

  const fetchOrder = async () => {
    if (!orderId || !store) return;

    try {
      // Get order token from URL params for secure access
      const orderToken = searchParams.get('ot') || '';
      
      // Try public access first with token
      if (orderToken) {
        const { data, error } = await supabase.functions.invoke('get-order-public', {
          body: { 
            orderId: orderId, 
            storeId: store.id,
            token: orderToken 
          }
        });

        if (error) throw error;
        setOrder(data?.order || null);
        return;
      }

      // If no token, show error - payment processing requires order token
      console.error('Order access token missing');
      setLoading(false);
      setOrder(null);

    } catch (error) {
      console.error('Error fetching order:', error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async () => {
    if (!order) return;

    setVerifying(true);
    try {
      // Determine correct payment reference for provider
      const epsMerchantTxnId = order?.custom_fields?.eps?.merchantTransactionId || order?.custom_fields?.eps?.merchant_transaction_id;
      const ebpayTransactionId = order?.custom_fields?.ebpay?.transaction_id;
      let paymentRef = order.id;
      
      if (order.payment_method === 'eps') {
        paymentRef = epsMerchantTxnId;
      } else if (order.payment_method === 'ebpay') {
        paymentRef = ebpayTransactionId;
      }

      if ((order.payment_method === 'eps' && !epsMerchantTxnId) || (order.payment_method === 'ebpay' && !ebpayTransactionId)) {
        toast.error(`Missing ${order.payment_method.toUpperCase()} transaction reference. Please try again.`);
        setVerifying(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: {
          orderId: order.id,
          paymentId: paymentRef,
          method: order.payment_method,
        }
      });

      if (error) throw error;

      if (data.paymentStatus === 'success') {
        toast.success('Payment verified successfully!');
        // Clear cart after successful payment
        clearCart();
        const orderToken = searchParams.get('ot') || '';
        navigate(paths.orderConfirmation(order.id, orderToken));
      } else {
        toast.error('Payment verification failed. Please contact support.');
        setOrder(prev => ({ ...prev, status: 'payment_failed' }));
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusIcon = () => {
    if (!order) return <Clock className="h-8 w-8 text-muted-foreground" />;
    
    // Prioritize URL status over database status
    const currentStatus = (urlStatus === 'failed' || urlStatus === 'cancelled') ? 'cancelled' : order.status;
    
    switch (currentStatus) {
      case 'paid':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'cancelled':
      case 'payment_failed':
        return <XCircle className="h-8 w-8 text-red-500" />;
      case 'processing':
      case 'pending':
      default:
        return <Clock className="h-8 w-8 text-blue-500" />;
    }
  };

  const getStatusText = () => {
    if (!order) return 'Loading...';
    
    // Prioritize URL status over database status
    if (urlStatus === 'failed') return 'Payment Failed';
    if (urlStatus === 'cancelled') return 'Payment Cancelled';
    
    switch (order.status) {
      case 'paid':
        return 'Payment Successful';
      case 'cancelled':
        return 'Payment Cancelled';
      case 'payment_failed':
        return 'Payment Failed';
      case 'processing':
      case 'pending':
      default:
        return 'Payment Processing';
    }
  };

  const getStatusDescription = () => {
    if (!order) return 'Please wait while we load your order details.';
    
    // Prioritize URL status over database status
    if (urlStatus === 'failed' || urlStatus === 'cancelled') {
      return 'Your payment was not completed. The order has been cancelled. Please try again or contact support if you need assistance.';
    }
    
    switch (order.status) {
      case 'paid':
        return 'Your payment has been confirmed and your order is being processed.';
      case 'cancelled':
        return 'This order has been cancelled. Please contact support if you have any questions.';
      case 'payment_failed':
        return 'Your payment could not be processed. Please try again or contact support.';
      case 'processing':
      case 'pending':
      default:
        return 'Please complete your payment in the opened window and return here to verify your payment status.';
    }
  };

  // Delegate to CoursePaymentProcessing if this is a course order
  if (isCoursePayment === true) {
    return <CoursePaymentProcessing />;
  }

  if (loading || isCoursePayment === null) {
    const loadingContent = (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    );
    
    return loadingContent;
  }

  if (!order) {
    const notFoundContent = (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Order Processing</h1>
          <p className="text-muted-foreground mb-4">Please wait while we process your order...</p>
          <Button onClick={() => navigate(paths.home)}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
    
    return notFoundContent;
  }

  const content = (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-2xl">{getStatusText()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground">{getStatusDescription()}</p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Order Details</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Order Number:</span>
                  <span className="font-medium">{order.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium">
                    {order.payment_method === 'bkash' && 'bKash'}
                    {order.payment_method === 'nagad' && 'Nagad'}
                    {order.payment_method === 'eps' && 'Bank/Card/MFS'}
                    {order.payment_method === 'ebpay' && 'EB Pay'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-medium">৳{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Show verify button only for processing/pending status without URL failure indication */}
              {(order.status === 'processing' || order.status === 'pending') && urlStatus !== 'failed' && urlStatus !== 'cancelled' && (
                <Button 
                  onClick={verifyPayment} 
                  disabled={verifying}
                  className="w-full"
                >
                  {verifying ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Verifying Payment...
                    </>
                  ) : (
                    'Verify Payment Status'
                  )}
                </Button>
              )}
              
              {order.status === 'paid' && (
                <Button 
                  onClick={() => {
                    const orderToken = searchParams.get('ot') || '';
                    navigate(paths.orderConfirmation(order.id, orderToken));
                  }}
                  className="w-full"
                >
                  View Order Details
                </Button>
              )}

              {(order.status === 'payment_failed' || order.status === 'cancelled' || urlStatus === 'failed' || urlStatus === 'cancelled') && (
                <Button 
                  onClick={async () => {
                    if (funnelContext?.isFunnelCheckout && funnelContext.currentStepId) {
                      // Funnel checkout: redirect back to current step
                      try {
                        console.log('PaymentProcessing: Redirecting to funnel step:', funnelContext);
                        const { data: currentStep, error: stepError } = await supabase
                          .from('funnel_steps')
                          .select('slug, funnel_id')
                          .eq('id', funnelContext.currentStepId)
                          .single();
                        
                        if (!stepError && currentStep?.slug) {
                          const isAppEnvironment = (
                            window.location.hostname === 'localhost' || 
                            window.location.hostname.includes('ecombuildr.com')
                          );
                          
                          if (isAppEnvironment) {
                            // App/sandbox: use funnel-aware paths
                            const funnelUrl = `/funnel/${funnelContext.funnelId}/${currentStep.slug}`;
                            console.log(`PaymentProcessing: Funnel redirect (app): ${funnelUrl}`);
                            window.location.href = funnelUrl;
                          } else {
                            // Custom domain: use clean paths
                            const funnelUrl = `/${currentStep.slug}`;
                            console.log(`PaymentProcessing: Funnel redirect (custom domain): ${funnelUrl}`);
                            window.location.href = funnelUrl;
                          }
                        } else {
                          console.error('PaymentProcessing: Step not found, falling back to checkout');
                          navigate(paths.checkout);
                        }
                      } catch (error) {
                        console.error('PaymentProcessing: Error redirecting to funnel step:', error);
                        navigate(paths.checkout);
                      }
                    } else {
                      // Site checkout: existing behavior
                      navigate(paths.checkout);
                    }
                  }}
                  className="w-full"
                >
                  Try Again
                </Button>
              )}

              {/* Only show Continue Shopping for site checkout */}
              {!funnelContext?.isFunnelCheckout && (
              <Button 
                variant="outline" 
                onClick={() => navigate(paths.home)}
                className="w-full"
              >
                Continue Shopping
              </Button>
              )}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>If you're experiencing issues, please contact our support team.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return content;
};