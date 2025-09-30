import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useCart } from '@/contexts/CartContext';
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useEcomPaths } from '@/lib/pathResolver';

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
  const paths = useEcomPaths();
  const orderId = orderIdParam || searchParams.get('orderId') || '';
  const tempId = searchParams.get('tempId') || '';
  const paymentMethod = searchParams.get('pm') || '';
  const isWebsiteContext = Boolean(websiteId || websiteSlug);
  
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
    if (store) {
      if (tempId && urlStatus === 'success') {
        handleDeferredOrderCreation();
      } else if (orderId) {
        fetchOrder();
      }
    }
  }, [orderId, tempId, urlStatus, store]);

  // Auto-update order status if URL indicates failure/cancellation
  useEffect(() => {
    if (order && (urlStatus === 'failed' || urlStatus === 'cancelled') && !statusUpdated) {
      updateOrderStatusToCancelled();
    }
  }, [order, urlStatus, statusUpdated]);

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
      
      // Create order now that payment is successful
      const { data, error } = await supabase.functions.invoke('create-order-on-payment-success', {
        body: {
          orderData: checkoutData.orderData,
          itemsData: checkoutData.itemsPayload,
          storeId: store.id,
          paymentVerified: true,
          paymentDetails: {
            method: paymentMethod,
            tempId: tempId,
            verifiedAt: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.order) {
        // Clear stored checkout data
        sessionStorage.removeItem('pending_checkout');
        
        // Clear cart after successful order creation
        clearCart();
        
        // Navigate to order confirmation
        const newOrderToken = data.order.access_token;
        toast.success('Order created successfully!');
        navigate(paths.orderConfirmation(data.order.id, newOrderToken));
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
    if (!order || !orderId) return;
    
    setStatusUpdated(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (!error) {
        setOrder(prev => ({ ...prev, status: 'cancelled' }));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
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

  if (loading) {
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
    
    return isWebsiteContext ? loadingContent : <StorefrontLayout>{loadingContent}</StorefrontLayout>;
  }

  if (!order) {
    const notFoundContent = (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Order Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested order could not be found.</p>
          <Button onClick={() => navigate(paths.home)}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
    
    return isWebsiteContext ? notFoundContent : <StorefrontLayout>{notFoundContent}</StorefrontLayout>;
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
                  onClick={() => navigate(paths.checkout)}
                  className="w-full"
                >
                  Try Again
                </Button>
              )}

              <Button 
                variant="outline" 
                onClick={() => navigate(paths.home)}
                className="w-full"
              >
                Continue Shopping
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>If you're experiencing issues, please contact our support team.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (isWebsiteContext) {
    return content;
  }

  return (
    <StorefrontLayout>
      {content}
    </StorefrontLayout>
  );
};