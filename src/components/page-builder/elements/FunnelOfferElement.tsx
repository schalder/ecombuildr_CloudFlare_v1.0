import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFunnelStepContext } from '@/contexts/FunnelStepContext';
import { renderElementStyles } from '@/components/page-builder/utils/styleRenderer';
import { formatCurrency } from '@/lib/currency';
import { useEcomPaths } from '@/lib/pathResolver';
import { usePixelTracking } from '@/hooks/usePixelTracking';
import { usePixelContext } from '@/components/pixel/PixelManager';
import { useStore } from '@/contexts/StoreContext';
import { useParams } from 'react-router-dom';
import type { PageBuilderElement } from '../types';

interface FunnelOfferElementProps {
  element: PageBuilderElement;
  isBuilder?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
}

export const FunnelOfferElement: React.FC<FunnelOfferElementProps> = ({ 
  element, 
  isBuilder = false,
  deviceType = 'desktop'
}) => {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepData, setStepData] = useState<any>(null);
  const [productData, setProductData] = useState<any>(null);
  const [hasTrackedViewContent, setHasTrackedViewContent] = useState(false);
  const { toast } = useToast();
  const { stepId, funnelId } = useFunnelStepContext();
  const paths = useEcomPaths();
  const { pixels } = usePixelContext();
  const { store } = useStore();
  const { websiteId } = useParams<{ websiteId?: string }>();
  const { trackViewContent, trackPurchase } = usePixelTracking(pixels, store?.id, websiteId, funnelId);

  const orderId = searchParams.get('orderId');
  const token = searchParams.get('ot');

  // Load dynamic step and product data
  useEffect(() => {
    if (!stepId || isBuilder) return;

    const loadStepData = async () => {
      try {
        const { data: step, error } = await supabase
          .from('funnel_steps')
          .select(`
            *,
            offer_product:products(*)
          `)
          .eq('id', stepId)
          .single();

        if (error) throw error;

        setStepData(step);
        if (step?.offer_product) {
          setProductData(step.offer_product);
        }
      } catch (error) {
        console.error('Error loading step data:', error);
      }
    };

    loadStepData();
  }, [stepId, isBuilder]);

  // Track ViewContent event when offer product loads
  useEffect(() => {
    if (isBuilder || !productData || hasTrackedViewContent || !store || !pixels) return;

    // Track ViewContent for the offer product
    if (productData.id && productData.name && productData.price) {
      trackViewContent({
        id: productData.id,
        name: productData.name,
        price: parseFloat(stepData?.offer_price || productData.price || '0'),
        category: productData.category || undefined,
      });
      setHasTrackedViewContent(true);
      console.log('FunnelOfferElement: ViewContent event tracked for offer product:', productData.id);
    }
  }, [productData, stepData, isBuilder, hasTrackedViewContent, store, pixels, trackViewContent]);

  // Use dynamic data or fallback to element content
  const {
    title = "Special Offer",
    description = "Don't miss this exclusive offer!",
    acceptText = "Yes, I Want This!",
    declineText = "No Thanks"
  } = element.content || {};

  const productName = productData?.name || "Bonus Product";
  const originalPrice = productData?.compare_price || productData?.price || "99";
  const offerPrice = stepData?.offer_price || productData?.price || "49";

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

      console.log('Offer response data:', data);

      // Track Purchase event if offer was accepted
      if (action === 'accept' && productData && store && pixels) {
        try {
          const offerPriceValue = parseFloat(stepData?.offer_price || productData.price || '0');
          trackPurchase({
            transaction_id: orderId || `offer_${Date.now()}`,
            value: offerPriceValue,
            items: [{
              item_id: productData.id,
              item_name: productData.name,
              price: offerPriceValue,
              quantity: 1,
              item_category: productData.category || undefined,
            }],
          });
          console.log('FunnelOfferElement: Purchase event tracked for accepted offer:', {
            productId: productData.id,
            value: offerPriceValue,
            orderId
          });
        } catch (trackError) {
          console.error('FunnelOfferElement: Error tracking Purchase event:', trackError);
          // Don't block offer processing if tracking fails
        }
      }

      if (data?.nextStepSlug && data?.funnelSlug) {
        // Environment-aware redirect to next step
        const isAppEnvironment = (
          window.location.hostname === 'localhost' || 
          window.location.hostname === 'ecombuildr.com' ||
          window.location.hostname === 'ecombuildr.com' ||
          window.location.hostname === 'ecombuildr.com'
        );
        
        if (isAppEnvironment) {
          // App/sandbox: use funnel-aware paths
          const nextUrl = `/funnel/${funnelId}/${data.nextStepSlug}?orderId=${orderId}&ot=${token}`;
          console.log(`Redirecting to next step (app): ${nextUrl}`);
          window.location.href = nextUrl;
        } else {
          // Custom domain: use clean paths
          const nextUrl = `/${data.nextStepSlug}?orderId=${orderId}&ot=${token}`;
          console.log(`Redirecting to next step (custom domain): ${nextUrl}`);
          window.location.href = nextUrl;
        }
      } else {
        // No next step, go to order confirmation using path resolver
        const confirmUrl = paths.orderConfirmation(orderId, token);
        console.log(`Redirecting to order confirmation: ${confirmUrl}`);
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

  // Render element styles
  const elementStyles = renderElementStyles(element, deviceType);
  const responsiveStyles = element.styles?.responsive || { desktop: {}, mobile: {} };
  const currentStyles = responsiveStyles[deviceType] || {};

  // Helper to get styled value
  const getStyleValue = (prop: string, fallback: any) => {
    return currentStyles[prop] || element.styles?.[prop] || fallback;
  };

  const containerStyles = {
    backgroundColor: getStyleValue('backgroundColor', '#ffffff'),
    borderColor: getStyleValue('borderColor', '#e5e7eb'),
    borderWidth: getStyleValue('borderWidth', '1px'),
    borderRadius: getStyleValue('borderRadius', '8px'),
    boxShadow: getStyleValue('boxShadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)'),
    maxWidth: getStyleValue('maxWidth', '600px'),
  };

  const titleStyles = {
    fontSize: getStyleValue('titleFontSize', '24px'),
    fontWeight: getStyleValue('titleFontWeight', 'bold'),
    color: getStyleValue('titleColor', '#1f2937'),
    textAlign: getStyleValue('titleTextAlign', 'center'),
  };

  const buttonStyles = {
    backgroundColor: getStyleValue('buttonBackgroundColor', '#10b981'),
    color: getStyleValue('buttonTextColor', '#ffffff'),
    fontSize: getStyleValue('buttonFontSize', '16px'),
    fontWeight: getStyleValue('buttonFontWeight', 'semibold'),
    borderRadius: getStyleValue('buttonBorderRadius', '6px'),
    height: getStyleValue('buttonHeight', '56px'),
    '&:hover': {
      backgroundColor: getStyleValue('buttonHoverBackgroundColor', '#059669'),
    }
  };

  const linkStyles = {
    color: getStyleValue('linkTextColor', '#6b7280'),
    fontSize: getStyleValue('linkFontSize', '14px'),
    textDecoration: getStyleValue('linkTextDecoration', 'underline'),
    '&:hover': {
      color: getStyleValue('linkHoverColor', '#374151'),
    }
  };

  return (
    <div className="max-w-lg mx-auto" style={elementStyles}>
      <div 
        className="p-6 text-center"
        style={containerStyles}
      >
        {/* Product Name - Optional */}
        {productData && element.content.showProductName !== false && (
          <h3 className="text-xl font-semibold mb-3">{productName}</h3>
        )}
        
        {/* Price Display - Optional */}
        {productData && element.content.showPrice !== false && (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-3">
              {originalPrice && parseFloat(originalPrice.toString()) > parseFloat(offerPrice.toString()) && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatCurrency(parseFloat(originalPrice.toString()))}
                </span>
              )}
              <span className="text-3xl font-bold text-primary">
                {formatCurrency(parseFloat(offerPrice.toString()))}
              </span>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => handleOffer('accept')}
            disabled={isProcessing}
            className="w-full transition-colors font-semibold"
            style={buttonStyles}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin inline" />
                Processing...
              </>
            ) : (
              acceptText
            )}
          </button>

          <div className="text-center">
            <button
              onClick={() => handleOffer('decline')}
              disabled={isProcessing}
              className="transition-colors py-2"
              style={linkStyles}
            >
              {declineText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
