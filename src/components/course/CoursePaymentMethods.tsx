import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentMethodSettings {
  bkash: boolean;
  nagad: boolean;
  eps: boolean;
  ebpay: boolean;
}

interface CoursePaymentMethodsProps {
  storeId: string;
  value: PaymentMethodSettings;
  onChange: (methods: PaymentMethodSettings) => void;
}

interface StorePaymentSettings {
  payment?: {
    bkash?: { enabled: boolean };
    nagad?: { enabled: boolean };
    eps?: { enabled: boolean };
    ebpay?: { enabled: boolean };
  };
}

export const CoursePaymentMethods: React.FC<CoursePaymentMethodsProps> = ({
  storeId,
  value,
  onChange
}) => {
  const [loading, setLoading] = useState(true);
  const [availableMethods, setAvailableMethods] = useState({
    bkash: false,
    nagad: false,
    eps: false,
    ebpay: false
  });

  useEffect(() => {
    const fetchStorePaymentSettings = async () => {
      if (!storeId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('stores')
          .select('settings')
          .eq('id', storeId)
          .single();

        if (error) throw error;

        const settings = data?.settings as StorePaymentSettings;
        const paymentSettings = settings?.payment || {};

        setAvailableMethods({
          bkash: paymentSettings.bkash?.enabled || false,
          nagad: paymentSettings.nagad?.enabled || false,
          eps: paymentSettings.eps?.enabled || false,
          ebpay: paymentSettings.ebpay?.enabled || false
        });
      } catch (error) {
        console.error('Error fetching payment settings:', error);
        toast.error('Failed to load payment settings');
      } finally {
        setLoading(false);
      }
    };

    fetchStorePaymentSettings();
  }, [storeId]);

  const handleMethodToggle = (method: keyof PaymentMethodSettings, enabled: boolean) => {
    if (!availableMethods[method] && enabled) {
      toast.error(`${method.toUpperCase()} is not enabled in your store settings`);
      return;
    }

    onChange({
      ...value,
      [method]: enabled
    });
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'bkash':
        return <Smartphone className="h-4 w-4 text-pink-500" />;
      case 'nagad':
        return <Smartphone className="h-4 w-4 text-orange-500" />;
      case 'eps':
        return <Building2 className="h-4 w-4 text-blue-500" />;
      case 'ebpay':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'bkash':
        return 'bKash';
      case 'nagad':
        return 'Nagad';
      case 'eps':
        return 'EPS Payment Gateway';
      case 'ebpay':
        return 'EB Pay Gateway';
      default:
        return method;
    }
  };

  const getMethodDescription = (method: string) => {
    switch (method) {
      case 'bkash':
        return 'Manual approval required';
      case 'nagad':
        return 'Manual approval required';
      case 'eps':
        return 'Instant access after payment';
      case 'ebpay':
        return 'Instant access after payment';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Label className="text-sm">Payment Methods</Label>
          <p className="text-xs text-muted-foreground">
            Select which payment methods students can use to enroll
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  const hasAnyAvailableMethods = Object.values(availableMethods).some(enabled => enabled);

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm">Payment Methods</Label>
        <p className="text-xs text-muted-foreground">
          Select which payment methods students can use to enroll
        </p>
      </div>
      
      <div className="space-y-4">
        {!hasAnyAvailableMethods ? (
          <div className="text-center py-6">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Payment Methods Configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You need to set up payment methods in your store settings first.
            </p>
            <p className="text-xs text-muted-foreground">
              Go to Store Settings → Payment to configure bKash, Nagad, or EPS
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(availableMethods).map(([method, isAvailable]) => (
              <div key={method} className={`flex items-center justify-between p-3 rounded-lg border ${
                !isAvailable ? 'opacity-50 bg-muted/50' : 'bg-background'
              }`}>
                <div className="flex items-center gap-3">
                  {getMethodIcon(method)}
                  <div>
                    <Label className="font-medium">
                      {getMethodLabel(method)}
                    </Label>
                    {isAvailable && (
                      <p className="text-xs text-muted-foreground">
                        {getMethodDescription(method)}
                      </p>
                    )}
                    {!isAvailable && (
                      <p className="text-xs text-muted-foreground">
                        Not configured in store settings
                      </p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={value[method as keyof PaymentMethodSettings] && isAvailable}
                  onCheckedChange={(checked) => handleMethodToggle(method as keyof PaymentMethodSettings, checked)}
                  disabled={!isAvailable}
                />
              </div>
            ))}
            
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Manual payment methods (bKash, Nagad) require you to 
                approve enrollments manually. EPS and EB Pay provide instant access after successful payment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};