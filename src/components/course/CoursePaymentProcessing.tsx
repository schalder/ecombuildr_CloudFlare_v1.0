import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Clock, XCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const CoursePaymentProcessing: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { store } = useStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [autoVerifying, setAutoVerifying] = useState(false);

  const orderId = searchParams.get('orderId');
  const status = searchParams.get('status');
  const paymentRef = searchParams.get('payment_ref') || searchParams.get('trxID') || searchParams.get('MerchantTransactionId') || searchParams.get('transaction_id');

  useEffect(() => {
    console.log('[CoursePaymentProcessing] init', { orderId, status, paymentRef, search: typeof window !== 'undefined' ? window.location.search : '' });
    if (orderId) {
      fetchOrder();
    } else {
      console.warn('[CoursePaymentProcessing] Missing orderId in URL');
    }
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId) return;

    console.log('[CoursePaymentProcessing] fetchOrder:start', { orderId });
    try {
      const { data, error } = await supabase.functions.invoke('get-course-order-public', {
        body: { orderId }
      });

      if (error) throw error;
      
      const fetched = data?.order ?? null;
      console.log('[CoursePaymentProcessing] fetchOrder:response', { hasOrder: !!fetched, payment_status: fetched?.payment_status });
      setOrder(fetched);

      // Auto-redirect to confirmation if payment is completed
      if (fetched?.payment_status === 'completed') {
        console.log('[CoursePaymentProcessing] payment completed, redirecting to confirmation', { orderId });
        navigate(`/courses/order-confirmation?orderId=${orderId}&status=success`);
        return;
      }

      // For EPS and EB Pay, skip this page entirely — go straight to confirmation
      if (fetched?.payment_method === 'eps' || fetched?.payment_method === 'ebpay') {
        console.log('[CoursePaymentProcessing] EPS/EB Pay flow: redirecting to confirmation');
        navigate(`/courses/order-confirmation?orderId=${orderId}&status=${status || 'success'}`);
        return;
      }

      // Handle specific payment statuses
      const isFailed = status === 'failed' || fetched?.payment_status === 'failed' || fetched?.payment_status === 'payment_failed';
      if (isFailed) {
        console.warn('[CoursePaymentProcessing] payment failed', { status, payment_status: fetched?.payment_status });
        toast.error('Payment failed. Please try again.');
      } else if (status === 'cancelled') {
        console.warn('[CoursePaymentProcessing] payment cancelled');
        toast.error('Payment was cancelled.');
      }

    } catch (error) {
      console.error('[CoursePaymentProcessing] fetchOrder:error', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
      console.log('[CoursePaymentProcessing] fetchOrder:end');
    }
  };
  const verifyPayment = async () => {
    if (!orderId || !order) return;

    setVerifying(true);
    try {
      console.log('[CoursePaymentProcessing] verifyPayment:start', { orderId, payment_method: order.payment_method, paymentRef });

      let verificationFunction = '';
      let verificationBody: any = { orderId };

      switch (order.payment_method) {
        case 'eps': {
          const epsRef = paymentRef || order?.metadata?.eps?.merchantTransactionId || order?.metadata?.merchantTransactionId;
          if (!epsRef) {
            toast.error('Missing EPS transaction reference. Please try again.');
            console.warn('[CoursePaymentProcessing] verifyPayment:missing-eps-ref');
            return;
          }
          verificationFunction = 'eps-verify-payment';
          verificationBody = { 
            orderId, 
            paymentId: epsRef, 
            method: 'eps',
            password: localStorage.getItem('courseCheckoutPassword') // Get stored password
          };
          break;
        }
        case 'ebpay': {
          const ebpayRef = paymentRef || order?.metadata?.ebpay?.transactionId || order?.metadata?.transactionId;
          if (!ebpayRef) {
            toast.error('Missing EB Pay transaction reference. Please try again.');
            console.warn('[CoursePaymentProcessing] verifyPayment:missing-ebpay-ref');
            return;
          }
          verificationFunction = 'ebpay-verify-payment';
          verificationBody = { 
            orderId, 
            transactionId: ebpayRef, 
            method: 'ebpay',
            password: localStorage.getItem('courseCheckoutPassword') // Get stored password
          };
          break;
        }
        case 'bkash':
          verificationFunction = 'bkash-verify-payment';
          verificationBody = { orderId, paymentID: paymentRef };
          break;
        case 'nagad':
          verificationFunction = 'nagad-verify-payment';
          verificationBody = { orderId, transactionId: paymentRef };
          break;
        default:
          console.warn('[CoursePaymentProcessing] verifyPayment:unsupported-method', { method: order.payment_method });
          toast.error('Payment method not supported for verification');
          return;
      }

      console.log('[CoursePaymentProcessing] verifyPayment:invoke', { verificationFunction, verificationBody });
      const { data, error } = await supabase.functions.invoke(verificationFunction, {
        body: verificationBody
      });

      if (error) throw error;

      console.log('[CoursePaymentProcessing] verifyPayment:response', { data });
      if (data?.success) {
        toast.success('Payment verified successfully!');
        console.log('[CoursePaymentProcessing] verifyPayment:success-redirect');
        // Clear stored password
        localStorage.removeItem('courseCheckoutPassword');
        navigate(`/courses/order-confirmation?orderId=${orderId}&status=success`);
      } else {
        console.warn('[CoursePaymentProcessing] verifyPayment:failed', { message: data?.message });
        toast.error(data?.message || 'Payment verification failed');
      }

    } catch (error) {
      console.error('[CoursePaymentProcessing] verifyPayment:error', error);
      toast.error('Failed to verify payment');
    } finally {
      setVerifying(false);
      setAutoVerifying(false);
      console.log('[CoursePaymentProcessing] verifyPayment:end');
    }
  };

  const getStatusDisplay = () => {
    if (status === 'failed' || order?.payment_status === 'failed' || order?.payment_status === 'payment_failed') {
      return {
        icon: <XCircle className="h-12 w-12 text-red-500" />,
        title: 'Payment Failed',
        message: 'Your payment could not be processed. Please try enrolling again.',
        color: 'red'
      };
    }

    if (status === 'cancelled') {
      return {
        icon: <XCircle className="h-12 w-12 text-gray-500" />,
        title: 'Payment Cancelled',
        message: 'You cancelled the payment process. You can try again anytime.',
        color: 'gray'
      };
    }

    if (autoVerifying || verifying) {
      return {
        icon: <RefreshCw className="h-12 w-12 text-blue-500 animate-spin" />,
        title: 'Verifying Payment',
        message: 'Please wait while we verify your payment with the bank...',
        color: 'blue'
      };
    }

    return {
      icon: <Clock className="h-12 w-12 text-yellow-500" />,
      title: 'Processing Payment',
      message: 'Please wait while we process your payment...',
      color: 'yellow'
    };
  };

  const handleBackToCourse = () => {
    if (order?.course_id) {
      navigate(`/courses/${order.course_id}`);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              {statusDisplay.icon}
              
              <div>
                <h2 className="text-xl font-semibold mb-2">{statusDisplay.title}</h2>
                <p className="text-muted-foreground text-sm">{statusDisplay.message}</p>
              </div>

              {order.courses && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    {order.courses.thumbnail_url && (
                      <img
                        src={order.courses.thumbnail_url}
                        alt={order.courses.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="text-left">
                      <h3 className="font-medium">{order.courses.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Order #{order.order_number}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {/* Only show manual verify button for non-EPS/non-EB Pay methods */}
                {!autoVerifying && (status === 'success' || order.payment_status === 'pending') && order.payment_method !== 'eps' && order.payment_method !== 'ebpay' && (
                  <Button
                    onClick={verifyPayment}
                    disabled={verifying}
                    className="w-full"
                  >
                    {verifying ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify Payment
                      </>
                    )}
                  </Button>
                )}

                {/* Show auto-verification message */}
                {autoVerifying && (
                  <div className="text-center text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Automatically verifying your payment...</p>
                  </div>
                )}

                <Button
                  onClick={handleBackToCourse}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Course
                </Button>
              </div>

              {paymentRef && (
                <div className="text-xs text-muted-foreground">
                  Reference: {paymentRef}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoursePaymentProcessing;