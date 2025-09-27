import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
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
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const paths = useEcomPaths();
  const orderId = orderIdParam || searchParams.get('orderId') || '';
  const isWebsiteContext = Boolean(websiteId || websiteSlug);
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
    if (orderId && store) {
      fetchOrder();
    }
  }, [orderId, store]);

  // Auto-verify EPS payments on page load
  useEffect(() => {
    if (order && order.payment_method === 'eps' && order.status === 'pending') {
      const guardKey = `eps_autoverified_${order.id}`;
      
      // Check if we've already attempted auto-verification
      if (!sessionStorage.getItem(guardKey)) {
        sessionStorage.setItem(guardKey, 'true');
        
        const epsMerchantTxnId = order?.custom_fields?.eps?.merchantTransactionId || order?.custom_fields?.eps?.merchant_transaction_id;
        
        if (epsMerchantTxnId) {
          // Auto-verify the EPS payment
          supabase.functions.invoke('verify-payment', {
            body: {
              orderId: order.id,
              paymentId: epsMerchantTxnId,
              method: 'eps',
            }
          }).then(({ data, error }) => {
            if (!error && data?.paymentStatus === 'success') {
              // Navigate to order confirmation on successful verification
              const orderToken = searchParams.get('ot') || '';
              navigate(paths.orderConfirmation(order.id, orderToken));
            } else {
              // Clear guard on failure to allow manual retry
              sessionStorage.removeItem(guardKey);
            }
          }).catch(() => {
            // Clear guard on error to allow manual retry
            sessionStorage.removeItem(guardKey);
          });
        }
      }
    }
  }, [order, navigate, paths, searchParams]);

  const fetchOrder = async () => {
    if (!orderId || !store) return;

    try {
      // Get order token from URL params for secure access
      const orderToken = searchParams.get('ot') || '';
      if (!orderToken) {
        console.error('Order access token missing');
        toast.error('Invalid order access');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('get-order-public', {
        body: { 
          orderId: orderId, 
          storeId: store.id,
          token: orderToken 
        }
      });

      if (error) throw error;
      setOrder(data?.order || null);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
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
      const paymentRef = order.payment_method === 'eps' ? epsMerchantTxnId : order.id;

      if (order.payment_method === 'eps' && !paymentRef) {
        toast.error('Missing EPS transaction reference. Please try again.');
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
    
    switch (order.status) {
      case 'paid':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'payment_failed':
        return <XCircle className="h-8 w-8 text-red-500" />;
      case 'processing':
      default:
        return <Clock className="h-8 w-8 text-blue-500" />;
    }
  };

  const getStatusText = () => {
    if (!order) return 'Loading...';
    
    switch (order.status) {
      case 'paid':
        return 'Payment Successful';
      case 'payment_failed':
        return 'Payment Failed';
      case 'processing':
      default:
        return 'Payment Processing';
    }
  };

  const getStatusDescription = () => {
    if (!order) return 'Please wait while we load your order details.';
    
    switch (order.status) {
      case 'paid':
        return 'Your payment has been confirmed and your order is being processed.';
      case 'payment_failed':
        return 'Your payment could not be processed. Please try again or contact support.';
      case 'processing':
      default:
        return 'Please complete your payment in the opened window and return here to verify your payment status.';
    }
  };

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading order details...</p>
            </div>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (!order) {
    return (
      <StorefrontLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">Order Not Found</h1>
            <p className="text-muted-foreground mb-4">The requested order could not be found.</p>
            <Button onClick={() => navigate(paths.home)}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </StorefrontLayout>
    );
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
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-medium">৳{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {order.status === 'processing' && (
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

              {order.status === 'payment_failed' && (
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