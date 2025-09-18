import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  CreditCard, 
  User, 
  Mail, 
  Phone,
  Smartphone,
  Building2,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCourseCurrency } from '@/hooks/useCourseCurrency';
import { formatCoursePrice } from '@/utils/currency';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';

interface CourseCheckoutData {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  price: number;
  compare_price?: number;
  payment_methods: {
    bkash: boolean;
    nagad: boolean;
    eps: boolean;
  };
}

interface CheckoutForm {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  transaction_id: string;
}

const CourseCheckout = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { store } = useStore();
  const { currency } = useCourseCurrency();
  
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CheckoutForm>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    transaction_id: ''
  });

  const paymentMethod = searchParams.get('payment_method') || '';

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course-checkout', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required');
      
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, thumbnail_url, price, compare_price, payment_methods')
        .eq('id', courseId)
        .eq('is_published', true)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as CourseCheckoutData;
    },
    enabled: !!courseId
  });

  const getPaymentMethodInfo = (method: string) => {
    switch (method) {
      case 'bkash':
        return {
          name: 'bKash',
          icon: <Smartphone className="h-5 w-5 text-pink-500" />,
          description: 'Mobile payment via bKash'
        };
      case 'nagad':
        return {
          name: 'Nagad',
          icon: <Smartphone className="h-5 w-5 text-orange-500" />,
          description: 'Mobile payment via Nagad'
        };
      case 'eps':
        return {
          name: 'EPS Payment Gateway',
          icon: <img src="https://www.eps.com.bd/images/logo.png" alt="EPS" className="h-5 w-6 object-contain" />,
          description: 'Secure payment via eps.com.bd'
        };
      default:
        return {
          name: 'Unknown',
          icon: <CreditCard className="h-5 w-5" />,
          description: 'Payment method'
        };
    }
  };

  const handleInputChange = (field: keyof CheckoutForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!form.customer_name.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!form.customer_email.trim()) {
      toast.error('Please enter your email address');
      return false;
    }
    if (!form.customer_phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.customer_email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    // Validate transaction ID for manual payment methods
    if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && !form.transaction_id.trim()) {
      toast.error('Please enter your transaction ID for manual payment verification');
      return false;
    }

    return true;
  };

  const handleCheckout = async () => {
    if (!course || !store?.id || !validateForm()) return;

    setLoading(true);
    try {
      // Create course order
      const orderNumber = `CO-${Date.now()}`;
      
      const { data: orderData, error: orderError } = await supabase
        .from('course_orders')
        .insert({
          store_id: store.id,
          course_id: course.id,
          order_number: orderNumber,
          customer_name: form.customer_name.trim(),
          customer_email: form.customer_email.trim(),
          customer_phone: form.customer_phone.trim(),
          total: course.price,
          payment_method: paymentMethod,
          payment_status: 'pending',
          metadata: form.transaction_id.trim() ? { transaction_id: form.transaction_id.trim() } : null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Handle different payment methods
      if (paymentMethod === 'eps') {
        // Call EPS payment edge function
        const { data: epsResponse, error: epsError } = await supabase.functions.invoke('eps-payment', {
          body: {
            orderId: orderData.id,
            amount: course.price,
            storeId: store.id
          }
        });

        if (epsError) throw epsError;

        if (epsResponse.paymentURL) {
          window.location.href = epsResponse.paymentURL;
          return;
        }
      } else if (paymentMethod === 'bkash') {
        // Call bKash payment edge function
        const { data: bkashResponse, error: bkashError } = await supabase.functions.invoke('bkash-payment', {
          body: {
            orderId: orderData.id,
            amount: course.price,
            storeId: store.id
          }
        });

        if (bkashError) throw bkashError;

        if (bkashResponse.paymentURL) {
          window.location.href = bkashResponse.paymentURL;
          return;
        }
      } else if (paymentMethod === 'nagad') {
        // Call Nagad payment edge function
        const { data: nagadResponse, error: nagadError } = await supabase.functions.invoke('nagad-payment', {
          body: {
            orderId: orderData.id,
            amount: course.price,
            storeId: store.id
          }
        });

        if (nagadError) throw nagadError;

        if (nagadResponse.paymentURL) {
          window.location.href = nagadResponse.paymentURL;
          return;
        }
      }

      // For manual payment methods, show success message
      toast.success('Order created successfully! Please wait for approval.');
      navigate(`/courses/${course.id}?order=${orderData.id}`);

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to process checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <Button onClick={() => navigate('/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  const paymentInfo = getPaymentMethodInfo(paymentMethod);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate(`/courses/${courseId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Course
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={form.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.customer_email}
                  onChange={(e) => handleInputChange('customer_email', e.target.value)}
                  placeholder="Enter your email address"
                />
                <p className="text-xs text-muted-foreground">
                  Course access details will be sent to this email
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.customer_phone}
                  onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold">Payment Method</h3>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  {paymentInfo.icon}
                  <div>
                    <p className="font-medium">{paymentInfo.name}</p>
                    <p className="text-sm text-muted-foreground">{paymentInfo.description}</p>
                  </div>
                </div>
              </div>

              {/* Transaction ID field for manual payment methods */}
              {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
                <div className="space-y-2">
                  <Label htmlFor="transaction_id">Transaction ID *</Label>
                  <Input
                    id="transaction_id"
                    value={form.transaction_id}
                    onChange={(e) => handleInputChange('transaction_id', e.target.value)}
                    placeholder="Enter your transaction ID"
                  />
                  <p className="text-xs text-muted-foreground">
                    Please enter the transaction ID from your {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} payment
                  </p>
                </div>
              )}
              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Complete Enrollment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                {course.thumbnail_url && (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{course.title}</h3>
                  {course.description && (
                    <div 
                      className="text-sm text-muted-foreground line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: course.description }}
                    />
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Course Price</span>
                  <span className="font-semibold">{formatCoursePrice(course.price, currency)}</span>
                </div>
                {course.compare_price && course.compare_price > course.price && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Original Price</span>
                    <span className="line-through">{formatCoursePrice(course.compare_price, currency)}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCoursePrice(course.price, currency)}</span>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>Secure payment • 30-day money-back guarantee</p>
              </div>

              {paymentMethod !== 'eps' && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-center">
                    <strong>Note:</strong> Manual payment methods require approval. 
                    You'll receive course access after payment verification.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseCheckout;
