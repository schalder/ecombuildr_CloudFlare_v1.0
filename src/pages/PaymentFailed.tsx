import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function PaymentFailed() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const status = searchParams.get('status');
  const subscriptionId = searchParams.get('subscriptionId');

  // Clean up pending subscription on payment failure/cancellation
  useEffect(() => {
    const cleanupPendingSubscription = async () => {
      if (!subscriptionId) return;

      try {
        console.log('Cleaning up pending subscription:', subscriptionId);
        
        // Delete the pending subscription record since payment failed/cancelled
        const { error } = await supabase
          .from('saas_subscriptions')
          .delete()
          .eq('id', subscriptionId)
          .eq('subscription_status', 'pending');

        if (error) {
          console.error('Failed to clean up subscription:', error);
        } else {
          console.log('Pending subscription cleaned up successfully');
        }
      } catch (error) {
        console.error('Error cleaning up subscription:', error);
      }
    };

    cleanupPendingSubscription();
  }, [subscriptionId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-6 w-6" />
            Payment {status === 'failed' ? 'Failed' : 'Cancelled'}
          </CardTitle>
          <CardDescription>
            {status === 'failed' 
              ? 'Your payment could not be processed. Please try again.'
              : 'You cancelled the payment process.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={() => navigate('/dashboard/settings/billing')} className="w-full">
            Return to Billing
          </Button>
          <Button 
            onClick={() => navigate('/dashboard/settings/billing')} 
            variant="outline" 
            className="w-full"
          >
            Try Different Payment Method
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
