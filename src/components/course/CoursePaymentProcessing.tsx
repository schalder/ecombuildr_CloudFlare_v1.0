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

  const orderId = searchParams.get('orderId');
  const status = searchParams.get('status');
  const paymentRef = searchParams.get('payment_ref') || searchParams.get('trxID') || searchParams.get('MerchantTransactionId');

  useEffect(() => {
    if (orderId && store) {
      fetchOrder();
    }
  }, [orderId, store]);

  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      const { data, error } = await supabase
        .from('course_orders')
        .select(`
          *,
          courses (
            title,
            thumbnail_url
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      
      setOrder(data);

      // Auto-redirect to confirmation if payment is completed
      if (data.payment_status === 'completed') {
        navigate(`/order-confirmation?orderId=${orderId}&status=success`);
        return;
      }

      // Handle specific payment statuses
      if (status === 'failed' || data.payment_status === 'failed') {
        toast.error('Payment failed. Please try again.');
      } else if (status === 'cancelled') {
        toast.error('Payment was cancelled.');
      }

    } catch (error) {
      console.error('Error fetching course order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async () => {
    if (!orderId || !order) return;

    setVerifying(true);
    try {
      if (order.payment_method === 'eps' && !paymentRef) {
        toast.error('Missing EPS transaction reference. Please try again.');
        return;
      }

      // Call verification function based on payment method
      let verificationFunction = '';
      let verificationBody: any = { orderId, storeId: store?.id };

      switch (order.payment_method) {
        case 'eps':
          verificationFunction = 'eps-verify-payment';
          verificationBody.transactionRef = paymentRef;
          break;
        case 'bkash':
          verificationFunction = 'bkash-verify-payment';
          verificationBody.paymentID = paymentRef;
          break;
        case 'nagad':
          verificationFunction = 'nagad-verify-payment';
          verificationBody.transactionId = paymentRef;
          break;
        default:
          toast.error('Payment method not supported for verification');
          return;
      }

      const { data, error } = await supabase.functions.invoke(verificationFunction, {
        body: verificationBody
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Payment verified successfully!');
        navigate(`/order-confirmation?orderId=${orderId}&status=success`);
      } else {
        toast.error(data.message || 'Payment verification failed');
      }

    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusDisplay = () => {
    if (status === 'failed' || order?.payment_status === 'failed') {
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
                {(status === 'success' || order.payment_status === 'pending') && (
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