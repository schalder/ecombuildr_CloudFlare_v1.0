import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, BookOpen, Clock, CreditCard, ArrowLeft } from 'lucide-react';
import { formatCoursePrice } from '@/utils/currency';
import { useCourseCurrency } from '@/hooks/useCourseCurrency';

interface CourseOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_method: string;
  payment_status: string;
  total: number;
  created_at: string;
  course_id: string;
  metadata?: {
    member_password?: string;
    [key: string]: any;
  };
  courses?: {
    title: string;
    description?: string;
    thumbnail_url?: string;
  };
  memberCredentials?: {
    email: string;
    password: string | null;
  } | null;
}

export const CourseOrderConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const { currency } = useCourseCurrency();
  const [order, setOrder] = useState<CourseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('orderId');
  const status = searchParams.get('status');

  useEffect(() => {
    console.log('[CourseOrderConfirmation] init', { orderId, status, search: typeof window !== 'undefined' ? window.location.search : '' });
    if (orderId) {
      fetchOrder();
    } else {
      console.warn('[CourseOrderConfirmation] Missing orderId in URL');
    }
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId) return;

    console.log('[CourseOrderConfirmation] fetchOrder:start', { orderId });
    try {
      const { data, error } = await supabase.functions.invoke('get-course-order-public', {
        body: { orderId }
      });

      if (error) throw error;

      const fetched = data?.order ?? null;
      console.log('[CourseOrderConfirmation] fetchOrder:response', { hasOrder: !!fetched, payment_status: fetched?.payment_status });
      setOrder(fetched);

      if (!fetched) {
        console.warn('[CourseOrderConfirmation] fetchOrder:not-found', { orderId });
      }
    } catch (error) {
      console.error('[CourseOrderConfirmation] fetchOrder:error', error);
    } finally {
      setLoading(false);
      console.log('[CourseOrderConfirmation] fetchOrder:end');
    }
  };
  const getStatusInfo = () => {
    if (status === 'success' || order?.payment_status === 'completed') {
      return {
        icon: <CheckCircle className="h-12 w-12 text-green-500" />,
        title: 'Enrollment Successful!',
        description: 'Your course enrollment has been confirmed.',
        color: 'green'
      };
    } else if (status === 'failed') {
      return {
        icon: <CreditCard className="h-12 w-12 text-red-500" />,
        title: 'Payment Failed',
        description: 'Your payment could not be processed. Please try again.',
        color: 'red'
      };
    } else {
      return {
        icon: <Clock className="h-12 w-12 text-yellow-500" />,
        title: 'Payment Pending',
        description: 'Your enrollment is pending payment confirmation.',
        color: 'yellow'
      };
    }
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
    console.warn('[CourseOrderConfirmation] render:not-found', { orderId, status });
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

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Status Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                {statusInfo.icon}
                <div>
                  <h1 className="text-2xl font-bold">{statusInfo.title}</h1>
                  <p className="text-muted-foreground">{statusInfo.description}</p>
                </div>
                
                {order.order_number && (
                  <div className="text-sm text-muted-foreground">
                    Order #{order.order_number}
                  </div>
                )}

                <Badge 
                  variant={statusInfo.color === 'green' ? 'default' : 
                          statusInfo.color === 'red' ? 'destructive' : 'secondary'}
                >
                  {order.payment_status === 'completed' ? 'Confirmed' :
                   order.payment_status === 'failed' ? 'Failed' : 'Pending'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Course Details */}
          {order.courses && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  {order.courses.thumbnail_url && (
                    <img
                      src={order.courses.thumbnail_url}
                      alt={order.courses.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{order.courses.title}</h3>
                    {order.courses.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {order.courses.description}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span>Total Paid</span>
                  <span className="font-semibold">{formatCoursePrice(order.total, currency)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span>{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{order.customer_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span>{order.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="capitalize">{order.payment_method}</span>
              </div>
            </CardContent>
          </Card>

          {/* Member Access Information - Show for completed and pending orders */}
          {(order.payment_status === 'completed' || order.payment_status === 'pending') && (
            <Card className={order.payment_status === 'completed' ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}>
              <CardHeader>
                <CardTitle className={`${order.payment_status === 'completed' ? 'text-green-700' : 'text-blue-700'} flex items-center gap-2`}>
                  <CheckCircle className="h-5 w-5" />
                  Course Access Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-3">
                    Use these credentials to access your course member dashboard:
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Login Email:</span>
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {order.customer_email}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Password:</span>
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {order.memberCredentials?.password || order.metadata?.member_password || 'Check email for credentials'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button 
                      onClick={() => window.open('/courses/members', '_blank')}
                      className="w-full"
                      variant={order.payment_status === 'completed' ? 'default' : 'outline'}
                    >
                      Access Member Dashboard
                    </Button>
                  </div>
                  {order.payment_status === 'pending' && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-yellow-800 text-sm">
                        <strong>Note:</strong> Your payment is being verified. You can log in, but course access will be activated once payment is confirmed.
                      </p>
                    </div>
                  )}
                  {order.payment_status === 'completed' && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-green-800 text-sm">
                        <strong>Congratulations!</strong> Your payment has been confirmed and you now have full access to the course.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                {order.payment_status === 'completed' ? (
                  <div>
                    <h3 className="font-semibold text-green-600">What's Next?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You'll receive course access details via email within 24 hours.
                    </p>
                    <Button onClick={handleBackToCourse} className="w-full">
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Course Details
                    </Button>
                  </div>
                ) : order.payment_status === 'failed' ? (
                  <div>
                    <h3 className="font-semibold text-red-600">Payment Failed</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Please try enrolling again or contact support.
                    </p>
                    <Button onClick={handleBackToCourse} variant="outline" className="w-full">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Course
                    </Button>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-yellow-600">Payment Pending</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your enrollment is being processed. You'll receive confirmation once payment is verified.
                    </p>
                    <Button onClick={handleBackToCourse} variant="outline" className="w-full">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Course
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseOrderConfirmation;