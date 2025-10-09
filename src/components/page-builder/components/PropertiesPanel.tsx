import React from 'react';
import { 
  Type, 
  Palette, 
  Layout, 
  Monitor,
  Tablet,
  Smartphone,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

import { ImageUpload } from '@/components/ui/image-upload';
import { ContentProperties } from './ContentProperties';
import { 
  EcommerceContentProperties,
  FeaturedProductsContentProperties,
  ProductCategoriesContentProperties,
  PriceContentProperties,
  ContactFormContentProperties,
  NewsletterContentProperties,
  ProductsPageContentProperties,
  RelatedProductsContentProperties,
  WeeklyFeaturedElementProperties
} from './EcommerceProperties';
import { CheckoutContentProperties } from './CheckoutContentProperties';
import { InlineCheckoutContentProperties } from './InlineCheckoutContentProperties';
import { OrderConfirmationContentProperties } from './OrderConfirmationContentProperties';
import { FormProperties } from './FormProperties';
import { 
  GoogleMapsProperties, 
  CustomHTMLProperties, 
  SocialShareProperties,
  SocialLinksProperties 
} from './AdvancedProperties';
import { FunnelOfferContentProperties } from './FunnelOfferContentProperties';
import { HeroSliderContentProperties } from './HeroSliderContentProperties';
import { CountdownProperties } from './CountdownProperties';
import { 
  TestimonialContentProperties,
  FAQContentProperties,
  AccordionContentProperties,
  TabsContentProperties
} from './ContentPropertiesLegacy';
import { 
  ImageFeatureContentProperties
} from './ImageFeatureContentProperties';
import { 
  ImageGalleryProperties,
  ImageCarouselProperties,
  VideoPlaylistProperties
} from './MediaProperties';
import {
  TextElementStyles,
  MediaElementStyles, 
  LayoutElementStyles,
  ButtonElementStyles,
  SocialShareElementStyles,
  OrderConfirmationElementStyles,
  EcommerceActionButtonStyles,
  WeeklyFeaturedElementStyles,
  ListElementStyles,
  PriceElementStyles,
  HeroSliderElementStyles,
  TestimonialElementStyles,
  FunnelOfferElementStyles
} from './ElementStyles';
import { ImageFeatureElementStyles } from './ElementStyles/ImageFeatureElementStyles';
import { CustomHTMLElementStyles } from './ElementStyles/CustomHTMLElementStyles';
import { CountdownElementStyles } from './ElementStyles/CountdownElementStyles';
import { CheckoutElementStyles } from './ElementStyles/CheckoutElementStyles';
import { AccordionElementStyles } from './ElementStyles/AccordionElementStyles';
import { FAQElementStyles } from './ElementStyles/FAQElementStyles';
import { FormElementStyles } from './ElementStyles/FormElementStyles';

import { PageBuilderElement } from '../types';
import { useDevicePreview } from '../contexts/DevicePreviewContext';

interface PropertiesPanelProps {
  selectedElement?: PageBuilderElement | null;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onUpdateElement
}) => {
  const { deviceType } = useDevicePreview();
  if (!selectedElement) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">Select an element to edit its properties</p>
      </div>
    );
  }

  const handleStyleUpdate = (property: string, value: any) => {
    onUpdateElement(selectedElement.id, {
      styles: {
        ...selectedElement.styles,
        [property]: value
      }
    });
  };

  const handleContentUpdate = (property: string, value: any) => {
    if (property === 'visibility') {
      // Handle visibility as a top-level property
      onUpdateElement(selectedElement.id, {
        visibility: value
      });
    } else {
      // Handle other content properties normally
      onUpdateElement(selectedElement.id, {
        content: {
          ...selectedElement.content,
          [property]: value
        }
      });
    }
  };

  // Determine which style component to render based on element type
  const renderElementStyles = () => {
    // Button elements get their own specialized component
    if (selectedElement.type === 'button') {
      return <ButtonElementStyles key={`button-${selectedElement.id}`} element={selectedElement} onStyleUpdate={handleStyleUpdate} onContentUpdate={handleContentUpdate} />;
    }
    
    // Order Confirmation specialized styles
    if (selectedElement.type === 'order-confirmation') {
      return <OrderConfirmationElementStyles element={selectedElement} onStyleUpdate={handleStyleUpdate} />;
    }

    // For elements that need both text and button styling
    if (['related-products', 'cart-full'].includes(selectedElement.type)) {
      return (
        <>
          <TextElementStyles key={`text-${selectedElement.id}`} element={selectedElement} onStyleUpdate={handleStyleUpdate} />
          <EcommerceActionButtonStyles key={`btn-${selectedElement.id}`} element={selectedElement} onStyleUpdate={handleStyleUpdate} />
        </>
      );
    }

    if (selectedElement.type === 'weekly-featured') {
      return (
        <WeeklyFeaturedElementStyles
          key={`wf-${selectedElement.id}`}
          element={selectedElement}
          onStyleUpdate={handleStyleUpdate}
          deviceType={deviceType}
        />
      );
    }

    if (selectedElement.type === 'list') {
      return (
        <>
          <TextElementStyles key={`text-${selectedElement.id}`} element={selectedElement} onStyleUpdate={handleStyleUpdate} />
          <ListElementStyles key={`list-${selectedElement.id}`} element={selectedElement} onStyleUpdate={handleStyleUpdate} />
        </>
      );
    }

    // Text-based elements (heading, text, product-grid, featured-products)
    if (['heading', 'text', 'product-grid', 'featured-products', 'products-page'].includes(selectedElement.type)) {
      return <TextElementStyles key={`text-${selectedElement.id}`} element={selectedElement} onStyleUpdate={handleStyleUpdate} />;
    }
    
    // Media elements (image, video, image-carousel, image-gallery, video-playlist)
    if (['image', 'video', 'image-carousel', 'image-gallery', 'video-playlist'].includes(selectedElement.type)) {
      return <MediaElementStyles element={selectedElement} onStyleUpdate={handleStyleUpdate} onContentUpdate={handleContentUpdate} />;
    }
    
    // Layout elements (spacer, divider)
    if (['spacer', 'divider'].includes(selectedElement.type)) {
      return <LayoutElementStyles element={selectedElement} onStyleUpdate={handleStyleUpdate} />;
    }
    
    // Form elements
    if (['contact-form', 'newsletter'].includes(selectedElement.type)) {
      return <FormElementStyles element={selectedElement} onStyleUpdate={handleStyleUpdate} />;
    }

    // Checkout element button styles
    if (['checkout-full', 'checkout-inline'].includes(selectedElement.type)) {
      return <CheckoutElementStyles element={selectedElement} onStyleUpdate={handleStyleUpdate} />;
    }

    // Countdown timer element styles
    if (selectedElement.type === 'countdown-timer') {
      return <CountdownElementStyles element={selectedElement} onStyleUpdate={handleStyleUpdate} />;
    }

    // Price element styles
    if (selectedElement.type === 'price') {
      return (
        <PriceElementStyles
          key={`price-${selectedElement.id}`}
          element={selectedElement}
          onStyleUpdate={handleStyleUpdate}
          deviceType={deviceType}
        />
      );
    }

    // Social Share element styles
    if (selectedElement.type === 'social-share') {
      return <SocialShareElementStyles element={selectedElement} onStyleUpdate={handleStyleUpdate} />;
    }

    // Social Links element styles (reuse Social Share styles)
    if (selectedElement.type === 'social-links') {
      return <SocialShareElementStyles element={selectedElement} onStyleUpdate={handleStyleUpdate} />;
    }
    
    // Hero Slider element styles
    if (selectedElement.type === 'hero-slider') {
      return <HeroSliderElementStyles element={selectedElement} onStyleUpdate={handleStyleUpdate} />;
    }

    // Custom HTML element styles
    if (selectedElement.type === 'custom-html') {
      return (
        <CustomHTMLElementStyles
          styles={selectedElement.styles || {}}
          onStyleUpdate={handleStyleUpdate}
          deviceType={deviceType}
        />
      );
    }
    
    if (selectedElement.type === 'accordion') {
      return (
        <AccordionElementStyles
          element={selectedElement}
          onStyleUpdate={handleStyleUpdate}
        />
      );
    }
    
    if (selectedElement.type === 'faq') {
      return (
        <FAQElementStyles
          element={selectedElement}
          onStyleUpdate={handleStyleUpdate}
        />
      );
    }
    
    if (selectedElement.type === 'testimonial') {
      return (
        <TestimonialElementStyles
          element={selectedElement}
          onStyleUpdate={handleStyleUpdate}
        />
      );
    }
    
    if (selectedElement.type === 'funnel-offer') {
      return (
        <FunnelOfferElementStyles
          element={selectedElement}
          onStyleUpdate={handleStyleUpdate}
        />
      );
    }
    
    if (selectedElement.type === 'image-feature') {
      return (
        <ImageFeatureElementStyles
          element={selectedElement}
          onStyleUpdate={handleStyleUpdate}
        />
      );
    }
    
    // Default fallback for any other element types (ecommerce, content, media, advanced)
    return <TextElementStyles element={selectedElement} onStyleUpdate={handleStyleUpdate} />;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Element Info */}
        <div>
          <h3 className="font-medium text-sm mb-2">Element Properties</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Type: <span className="capitalize">{selectedElement.type}</span></p>
            <p>ID: {selectedElement.id.slice(-8)}</p>
          </div>
        </div>

        <Separator />

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 mt-4">
            {['heading', 'text', 'image', 'button', 'video', 'spacer', 'divider', 'list', 'navigation-menu'].includes(selectedElement.type) ? (
              <ContentProperties 
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            ) : null}

            {/* Ecommerce Elements */}
            {selectedElement.type === 'product-grid' && (
              <EcommerceContentProperties 
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {selectedElement.type === 'products-page' && (
              <ProductsPageContentProperties 
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {selectedElement.type === 'featured-products' && (
              <FeaturedProductsContentProperties 
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {selectedElement.type === 'related-products' && (
              <RelatedProductsContentProperties
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {selectedElement.type === 'weekly-featured' && (
              <WeeklyFeaturedElementProperties
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {selectedElement.type === 'product-categories' && (
              <ProductCategoriesContentProperties 
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {selectedElement.type === 'price' && (
              <PriceContentProperties 
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {selectedElement.type === 'checkout-full' && (
              <CheckoutContentProperties
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {selectedElement.type === 'checkout-inline' && (
              <InlineCheckoutContentProperties
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {selectedElement.type === 'order-confirmation' && (
              <OrderConfirmationContentProperties
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {/* Form Elements */}
            {selectedElement.type === 'contact-form' && (
              <ContactFormContentProperties 
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {selectedElement.type === 'newsletter' && (
              <FormProperties 
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {/* Content Elements */}
            {selectedElement.type === 'image-feature' && (
              <ImageFeatureContentProperties 
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {selectedElement.type === 'testimonial' && (
              <TestimonialContentProperties 
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {selectedElement.type === 'faq' && (
              <FAQContentProperties 
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {selectedElement.type === 'accordion' && (
              <AccordionContentProperties 
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

                {selectedElement.type === 'tabs' && (
                  <TabsContentProperties 
                    element={selectedElement} 
                    onUpdate={handleContentUpdate} 
                  />
                )}

                {/* Media Elements */}
                {selectedElement.type === 'image-gallery' && (
                  <ImageGalleryProperties 
                    element={selectedElement} 
                    onUpdate={handleContentUpdate} 
                  />
                )}

                {selectedElement.type === 'image-carousel' && (
                  <ImageCarouselProperties 
                    element={selectedElement} 
                    onUpdate={handleContentUpdate} 
                  />
                )}

                {selectedElement.type === 'video-playlist' && (
                  <VideoPlaylistProperties 
                    element={selectedElement} 
                    onUpdate={handleContentUpdate} 
                  />
                )}

                {/* Advanced Elements */}
                {selectedElement.type === 'google-maps' && (
                  <GoogleMapsProperties 
                    element={selectedElement} 
                    onUpdate={handleContentUpdate} 
                  />
                )}

                {selectedElement.type === 'custom-html' && (
                  <CustomHTMLProperties 
                    element={selectedElement} 
                    onUpdate={handleContentUpdate} 
                  />
                )}

                {selectedElement.type === 'social-share' && (
                  <SocialShareProperties 
                    element={selectedElement} 
                    onUpdate={handleContentUpdate} 
                  />
                )}

                {selectedElement.type === 'social-links' && (
                  <SocialLinksProperties 
                    element={selectedElement} 
                    onUpdate={handleContentUpdate} 
                  />
                )}

                {selectedElement.type === 'countdown-timer' && (
                  <CountdownProperties 
                    element={selectedElement} 
                    onUpdate={handleContentUpdate} 
                  />
                )}

                {selectedElement.type === 'hero-slider' && (
                  <HeroSliderContentProperties 
                    element={selectedElement} 
                    onUpdate={handleContentUpdate} 
                  />
                )}

                {selectedElement.type === 'funnel-offer' && (
                  <FunnelOfferContentProperties 
                    element={selectedElement} 
                    onUpdate={handleContentUpdate} 
                  />
                )}
          </TabsContent>

          <TabsContent value="style" className="space-y-4 mt-4">
            {/* Render element-specific styles based on element type */}
            {renderElementStyles()}
            
            {/* Add button styles for products-page element */}
            {selectedElement.type === 'products-page' && (
              <EcommerceActionButtonStyles
                element={selectedElement}
                onStyleUpdate={handleStyleUpdate}
              />
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Advanced</h4>

              {/* Element Anchor ID */}
              <div>
                <Label className="text-xs">Element ID (Anchor)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={selectedElement.anchor || ''} 
                    onChange={(e) => onUpdateElement(selectedElement.id, { anchor: e.target.value })}
                    placeholder="my-custom-element"
                  />
                  <Button size="sm" onClick={() => selectedElement.anchor && navigator.clipboard.writeText(selectedElement.anchor!)}>Copy</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Used for CSS targeting, JavaScript access, and in-page scrolling (#anchor)</p>
              </div>
              

              <div>
                <Label className="text-xs">Custom CSS</Label>
                <textarea
                  className="w-full h-24 p-2 border border-border rounded text-sm resize-vertical font-mono"
                  placeholder="color: red; font-weight: bold; border-radius: 8px;"
                  value={selectedElement.content?.customCSS || ''}
                  onChange={(e) => handleContentUpdate('customCSS', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Custom CSS styles for this element. Will be applied with high specificity.
                </p>
              </div>

              <div>
                <Label className="text-xs">Custom JavaScript</Label>
                <textarea
                  className="w-full h-24 p-2 border border-border rounded text-sm resize-vertical font-mono"
                  placeholder="// Access this element via 'targetElement'
targetElement.addEventListener('click', function() {
  console.log('Clicked!');
});

// Optional cleanup function
cleanup = function() {
  // cleanup code here
};"
                  value={selectedElement.content?.customJS || ''}
                  onChange={(e) => handleContentUpdate('customJS', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Custom JavaScript with 'targetElement' variable and optional 'cleanup' function.
                </p>
              </div>

              {selectedElement.type === 'button' && (
                <div>
                  <Label className="text-xs">Button States</Label>
                  <div className="space-y-2 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Hover Color</Label>
                        <Input
                          type="color"
                          value={selectedElement.content.hoverColor || '#000000'}
                          onChange={(e) => handleContentUpdate('hoverColor', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Hover Background</Label>
                        <Input
                          type="color"
                          value={selectedElement.content.hoverBackground || '#ffffff'}
                          onChange={(e) => handleContentUpdate('hoverBackground', e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};