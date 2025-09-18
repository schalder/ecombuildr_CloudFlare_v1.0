import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
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
  courses?: {
    title: string;
    description?: string;
    thumbnail_url?: string;
  };
}

export const CourseOrderConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { store } = useStore();
  const { currency } = useCourseCurrency();
  const [order, setOrder] = useState<CourseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('orderId');
  const status = searchParams.get('status');

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
            description,
            thumbnail_url
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      
      setOrder(data);
    } catch (error) {
      console.error('Error fetching course order:', error);
    } finally {
      setLoading(false);
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