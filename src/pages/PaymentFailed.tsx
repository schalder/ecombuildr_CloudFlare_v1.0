import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export default function PaymentFailed() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const status = searchParams.get('status');

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
          <Button onClick={() => navigate('/billing')} className="w-full">
            Return to Billing
          </Button>
          <Button 
            onClick={() => navigate('/billing')} 
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
