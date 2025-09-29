import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle, 
  Smartphone, 
  Building2, 
  CreditCard,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCourseCurrency } from '@/hooks/useCourseCurrency';
import { formatCoursePrice } from '@/utils/currency';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  price: number;
  compare_price?: number;
  payment_methods: {
    bkash: boolean;
    nagad: boolean;
    eps: boolean;
  };
}

interface CourseEnrollmentCardProps {
  course: Course;
  storeId: string;
  themeSettings?: {
    module_color?: string;
    module_text_color?: string;
    enroll_button_color?: string;
    enroll_button_text_color?: string;
  };
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  enabled: boolean;
}

export const CourseEnrollmentCard: React.FC<CourseEnrollmentCardProps> = ({
  course,
  storeId,
  themeSettings
}) => {
  const navigate = useNavigate();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethod[]>([]);
  const { currency } = useCourseCurrency();

  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!storeId) return;

      try {
        const { data, error } = await supabase
          .from('stores')
          .select('settings')
          .eq('id', storeId)
          .single();

        if (error) throw error;

        const settings = data?.settings as any;
        const paymentSettings = settings?.payment || {};

        const methods: PaymentMethod[] = [];

        // Only add methods that are both enabled in store settings AND selected for this course
        if (paymentSettings.bkash?.enabled && course.payment_methods.bkash) {
          methods.push({
            id: 'bkash',
            name: 'bKash',
            icon: <Smartphone className="h-4 w-4 text-pink-500" />,
            description: 'Mobile payment via bKash',
            enabled: true
          });
        }

        if (paymentSettings.nagad?.enabled && course.payment_methods.nagad) {
          methods.push({
            id: 'nagad',
            name: 'Nagad',
            icon: <Smartphone className="h-4 w-4 text-orange-500" />,
            description: 'Mobile payment via Nagad',
            enabled: true
          });
        }

        if (paymentSettings.eps?.enabled && course.payment_methods.eps) {
          methods.push({
            id: 'eps',
            name: 'EPS Payment Gateway',
            icon: <img src="https://www.eps.com.bd/images/logo.png" alt="EPS" className="h-4 w-6 object-contain" />,
            description: 'Secure payment via eps.com.bd',
            enabled: true
          });
        }

        setAvailablePaymentMethods(methods);
        
        // Auto-select first available method
        if (methods.length > 0) {
          setSelectedPaymentMethod(methods[0].id);
        }
      } catch (error) {
        console.error('Error loading payment methods:', error);
        toast.error('Failed to load payment methods');
      }
    };

    loadPaymentMethods();
  }, [storeId, course.payment_methods]);

  const handleEnrollment = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (course.price === 0) {
      // Free course - direct enrollment
      toast.success('Successfully enrolled in the course!');
      return;
    }

    setLoading(true);
    try {
      // Navigate to course checkout page with selected payment method
      const checkoutUrl = `/courses/${course.id}/checkout?payment_method=${selectedPaymentMethod}`;
      navigate(checkoutUrl);
    } catch (error) {
      console.error('Error initiating enrollment:', error);
      toast.error('Failed to initiate enrollment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          {course.price > 0 ? (
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-3xl font-bold">{formatCoursePrice(course.price, currency)}</span>
                {course.compare_price && course.compare_price > course.price && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatCoursePrice(course.compare_price, currency)}
                  </span>
                )}
              </div>
              <Badge variant="secondary">Premium Course</Badge>
            </div>
          ) : (
            <div>
              <span className="text-3xl font-bold text-green-600">Free</span>
              <Badge variant="secondary" className="ml-2">Free Course</Badge>
            </div>
          )}
        </div>

        {course.price > 0 && availablePaymentMethods.length > 0 && (
          <div className="mb-4">
            <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select Payment Method" />
              </SelectTrigger>
              <SelectContent>
                {availablePaymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    <div className="flex items-center gap-2">
                      {method.icon}
                      <span>{method.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {course.price > 0 && availablePaymentMethods.length === 0 && (
          <div className="mb-4 p-4 bg-muted rounded-lg text-center">
            <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No payment methods available for this course
            </p>
          </div>
        )}
        
        <Button 
          className="w-full mb-4" 
          size="lg"
          onClick={handleEnrollment}
          disabled={loading || (course.price > 0 && (!selectedPaymentMethod || availablePaymentMethods.length === 0))}
          style={{ 
            backgroundColor: themeSettings?.enroll_button_color || '#10b981',
            borderColor: themeSettings?.enroll_button_color || '#10b981',
            color: themeSettings?.enroll_button_text_color || '#ffffff'
          }}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              {course.price > 0 ? 'Enroll Now' : 'Start Learning'}
            </>
          )}
        </Button>
        
      </CardContent>
    </Card>
  );
};