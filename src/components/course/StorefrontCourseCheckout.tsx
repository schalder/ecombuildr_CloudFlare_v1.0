import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  User, 
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
  password: string;
  transaction_id: string;
}

interface MemberLoginForm {
  email: string;
  password: string;
}

interface StorefrontCourseCheckoutProps {
  courseId: string;
}

const StorefrontCourseCheckout: React.FC<StorefrontCourseCheckoutProps> = ({ courseId }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { store } = useStore();
  const { currency } = useCourseCurrency();
  
  const [loading, setLoading] = useState(false);
  const [isNewStudent, setIsNewStudent] = useState(true);
  const [loginForm, setLoginForm] = useState<MemberLoginForm>({
    email: '',
    password: ''
  });
  const [form, setForm] = useState<CheckoutForm>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    password: '',
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
          icon: <Smartphone className="h-5 w-5" />,
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
    if (isNewStudent) {
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
      if (!form.password.trim()) {
        toast.error('Please create a password for your account');
        return false;
      }
      if (form.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return false;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.customer_email)) {
        toast.error('Please enter a valid email address');
        return false;
      }
    } else {
      if (!loginForm.email.trim()) {
        toast.error('Please enter your email address');
        return false;
      }
      if (!loginForm.password.trim()) {
        toast.error('Please enter your password');
        return false;
      }
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
      const customerData = isNewStudent ? {
        name: form.customer_name.trim(),
        email: form.customer_email.trim(),
        phone: form.customer_phone.trim(),
        password: form.password.trim(),
        transaction_id: form.transaction_id.trim()
      } : {
        name: '',
        email: loginForm.email.trim(),
        phone: '',
        password: loginForm.password.trim(),
        transaction_id: form.transaction_id.trim()
      };

      // Store password temporarily for EPS payments
      if (paymentMethod === 'eps' && isNewStudent) {
        localStorage.setItem('courseCheckoutPassword', form.password.trim());
      }

      // Call course checkout edge function
      const { data: paymentResponse, error: paymentError } = await supabase.functions.invoke('course-checkout', {
        body: {
          courseId: course.id,
          storeId: store.id,
          paymentMethod: paymentMethod,
          customerData,
          amount: course.price,
          isNewStudent
        }
      });

      if (paymentError) throw paymentError;

      if (paymentResponse.paymentURL) {
        // For EPS and other redirect-based payments
        window.location.href = paymentResponse.paymentURL;
        return;
      }

      if (paymentResponse.success) {
        // For successful transactions or manual approvals
        toast.success(paymentResponse.message || 'Enrollment successful!');
        navigate(`/courses/${course.id}?order=${paymentResponse.orderId}`);
      }

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to process checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(`/courses/${courseId}`);
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
          <Button onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
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
          onClick={handleGoBack}
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
              {/* Account Type Selection */}
              <div className="space-y-3">
                <h3 className="font-semibold">Account Status</h3>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={isNewStudent}
                      onChange={() => setIsNewStudent(true)}
                      className="text-primary"
                    />
                    <span>New Student</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!isNewStudent}
                      onChange={() => setIsNewStudent(false)}
                      className="text-primary"
                    />
                    <span>Returning Student</span>
                  </label>
                </div>
              </div>

              <Separator />

              {isNewStudent ? (
                // New Student Form
                <>
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

                  <div className="space-y-2">
                    <Label htmlFor="password">Create Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Create a password for your account"
                    />
                    <p className="text-xs text-muted-foreground">
                      You'll use this to access your courses later
                    </p>
                  </div>
                </>
              ) : (
                // Returning Student Login
                <>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email Address *</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password *</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your password"
                    />
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      Login with your existing account to purchase additional courses
                    </p>
                  </div>
                </>
              )}

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

export default StorefrontCourseCheckout;
