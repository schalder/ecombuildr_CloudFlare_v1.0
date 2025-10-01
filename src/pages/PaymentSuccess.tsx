import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscriptionId = searchParams.get('subscriptionId');
  const status = searchParams.get('status');
  const paymentMethod = searchParams.get('pm');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!subscriptionId || status !== 'success' || paymentMethod !== 'ebpay') {
        setError('Invalid payment parameters');
        setVerifying(false);
        return;
      }

      try {
        // Call verification edge function
        const { data, error } = await supabase.functions.invoke('platform-ebpay-verify-payment', {
          body: { subscriptionId }
        });

        if (error) throw error;

        if (data?.success) {
          setVerified(true);
          toast.success('Payment verified! Your account has been upgraded.');
          
          // Redirect to billing settings after 3 seconds
          setTimeout(() => {
            navigate('/billing');
          }, 3000);
        } else {
          throw new Error(data?.error || 'Payment verification failed');
        }
      } catch (err: any) {
        console.error('Payment verification error:', err);
        setError(err.message || 'Failed to verify payment');
        toast.error('Payment verification failed');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [subscriptionId, status, paymentMethod, navigate]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Verifying Payment
            </CardTitle>
            <CardDescription>
              Please wait while we verify your payment...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Payment Verification Failed</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/billing')} className="w-full">
              Return to Billing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Payment Successful!
          </CardTitle>
          <CardDescription>
            Your account has been successfully upgraded. Redirecting...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/billing')} className="w-full">
            Go to Billing
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
