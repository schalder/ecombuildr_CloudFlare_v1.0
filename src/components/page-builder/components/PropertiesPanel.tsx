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
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { OrderConfirmationContentProperties } from './OrderConfirmationContentProperties';
import { 
  TestimonialContentProperties,
  FAQContentProperties,
  AccordionContentProperties,
  TabsContentProperties
} from './ContentPropertiesLegacy';
import { 
  ImageGalleryProperties, 
  ImageCarouselProperties, 
  VideoPlaylistProperties 
} from './MediaProperties';
import { 
  GoogleMapsProperties, 
  CustomHTMLProperties, 
  SocialShareProperties 
} from './AdvancedProperties';
import {
  TextElementStyles,
  MediaElementStyles, 
  LayoutElementStyles,
  FormElementStyles,
  ButtonElementStyles,
  OrderConfirmationElementStyles,
  EcommerceActionButtonStyles,
  WeeklyFeaturedTypographyStyles,
  ListElementStyles
} from './ElementStyles';
import { CheckoutElementStyles } from './ElementStyles/CheckoutElementStyles';

import { PageBuilderElement } from '../types';

interface PropertiesPanelProps {
  selectedElement?: PageBuilderElement | null;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  deviceType,
  onUpdateElement
}) => {
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
    onUpdateElement(selectedElement.id, {
      content: {
        ...selectedElement.content,
        [property]: value
      }
    });
  };

  // Determine which style component to render based on element type
  const renderElementStyles = () => {
    console.log('🔧 PropertiesPanel renderElementStyles for type:', selectedElement.type);
    // Button elements get their own specialized component
    if (selectedElement.type === 'button') {
      console.log('🔧 Rendering ButtonElementStyles component');
      return <ButtonElementStyles key={`button-${selectedElement.id}`} element={selectedElement} onStyleUpdate={handleStyleUpdate} />;
    }
    
    // Order Confirmation specialized styles
    if (selectedElement.type === 'order-confirmation') {
      return <OrderConfirmationElementStyles element={selectedElement} onStyleUpdate={handleStyleUpdate} />;
    }

    // For elements that need both text and button styling
    if (['related-products'].includes(selectedElement.type)) {
      return (
        <>
          <TextElementStyles key={`text-${selectedElement.id}`} element={selectedElement} onStyleUpdate={handleStyleUpdate} />
          <EcommerceActionButtonStyles key={`btn-${selectedElement.id}`} element={selectedElement} onStyleUpdate={handleStyleUpdate} />
        </>
      );
    }

    if (selectedElement.type === 'weekly-featured') {
      return (
        <>
          {/* Card/background/border/spacing via TextElementStyles */}
          <TextElementStyles key={`text-${selectedElement.id}`} element={selectedElement} onStyleUpdate={handleStyleUpdate} showTypography={false} />
          {/* Per-part typography */}
          <WeeklyFeaturedTypographyStyles key={`wfty-${selectedElement.id}`} element={selectedElement} onStyleUpdate={handleStyleUpdate} />
          {/* Button styles */}
          <EcommerceActionButtonStyles key={`btn-${selectedElement.id}`} element={selectedElement} onStyleUpdate={handleStyleUpdate} />
        </>
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
    
    // Media elements (image, video)
    if (['image', 'video'].includes(selectedElement.type)) {
      return <MediaElementStyles element={selectedElement} onStyleUpdate={handleStyleUpdate} />;
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
    if (selectedElement.type === 'checkout-full') {
      return <CheckoutElementStyles element={selectedElement} onStyleUpdate={handleStyleUpdate} />;
    }
    
    // Default fallback for any other element types (ecommerce, content, media, advanced)
    return <TextElementStyles element={selectedElement} onStyleUpdate={handleStyleUpdate} />;
  };

  return (
    <ScrollArea className="h-full">
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
              <NewsletterContentProperties 
                element={selectedElement}
                onUpdate={handleContentUpdate}
              />
            )}

            {/* Content Elements */}
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
          </TabsContent>

          <TabsContent value="style" className="space-y-4 mt-4">
            {/* Render element-specific styles based on element type */}
            {renderElementStyles()}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Advanced</h4>
              
              <div>
                <Label className="text-xs">Element ID</Label>
                <Input
                  value={selectedElement.content.customId || selectedElement.id}
                  onChange={(e) => handleContentUpdate('customId', e.target.value)}
                  placeholder="my-custom-id"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Custom ID for CSS targeting and scripting
                </p>
              </div>

              <div>
                <Label className="text-xs">Custom CSS</Label>
                <textarea
                  className="w-full h-20 p-2 border border-border rounded text-sm resize-none font-mono"
                  placeholder="color: red; font-weight: bold; border-radius: 8px;"
                  value={selectedElement.content.customCSS || ''}
                  onChange={(e) => handleContentUpdate('customCSS', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Custom CSS will override default styles
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
    </ScrollArea>
  );
};