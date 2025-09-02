import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFunnelStepContext } from '@/contexts/FunnelStepContext';
import type { PageBuilderElement } from '../types';

interface FunnelOfferElementProps {
  element: PageBuilderElement;
  isBuilder?: boolean;
}

export const FunnelOfferElement: React.FC<FunnelOfferElementProps> = ({ 
  element, 
  isBuilder = false 
}) => {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { stepId } = useFunnelStepContext();

  const orderId = searchParams.get('orderId');
  const token = searchParams.get('ot'); // Standardize to 'ot' parameter

  const {
    title = "Special Offer",
    description = "Don't miss this exclusive offer!",
    productName = "Bonus Product",
    originalPrice = "99",
    offerPrice = "49",
    acceptText = "Yes, I Want This!",
    declineText = "No Thanks"
  } = element.content || {};

  const handleOffer = async (action: 'accept' | 'decline') => {
    if (isBuilder) {
      toast({
        title: "Preview Mode",
        description: `Would ${action} the offer`,
      });
      return;
    }

    if (!orderId || !token || !stepId) {
      toast({
        title: "Error",
        description: "Missing order information",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('funnel-offer', {
        body: {
          orderId,
          token, 
          stepId,
          action
        }
      });

      if (error) throw error;

      if (data?.nextStepSlug && data?.funnelSlug) {
        // Redirect to next step with order params
        const nextUrl = `/${data.funnelSlug}/${data.nextStepSlug}?orderId=${orderId}&ot=${token}`;
        window.location.href = nextUrl;
      } else {
        // No next step, go to order confirmation
        const confirmUrl = `/order-confirmation?orderId=${orderId}&ot=${token}`;
        window.location.href = confirmUrl;
      }

    } catch (error) {
      console.error('Offer processing error:', error);
      toast({
        title: "Error",
        description: "Failed to process offer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            {title}
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-2">{productName}</h3>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl text-muted-foreground line-through">
                ${originalPrice}
              </span>
              <span className="text-4xl font-bold text-primary">
                ${offerPrice}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Save ${(parseFloat(originalPrice) - parseFloat(offerPrice)).toFixed(2)}!
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={() => handleOffer('accept')}
              disabled={isProcessing}
              className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                acceptText
              )}
            </Button>

            <button
              onClick={() => handleOffer('decline')}
              disabled={isProcessing}
              className="w-full text-muted-foreground hover:text-foreground underline text-sm py-2 transition-colors"
            >
              {declineText}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
