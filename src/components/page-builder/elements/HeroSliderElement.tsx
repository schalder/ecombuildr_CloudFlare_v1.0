import React, { useState, useEffect } from 'react';
import { PageBuilderElement } from '../types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { generateResponsiveCSS, mergeResponsiveStyles } from '../utils/responsiveStyles';
import { DeviceType } from '../utils/responsive';

interface Slide {
  id: string;
  subHeadline?: string;
  headline: string;
  paragraph?: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonType?: 'url' | 'page' | 'action';
  image?: string;
  imageAlt?: string;
}

interface HeroSliderContent {
  slides: Slide[];
  autoplay: boolean;
  autoplayDelay: number;
  showDots: boolean;
  showArrows: boolean;
  loop: boolean;
  layout: 'overlay' | 'side-by-side' | 'text-only';
  textAlignment: 'left' | 'center' | 'right';
  overlayOpacity: number;
  animationType: 'fade' | 'slide' | 'scale';
}

interface HeroSliderElementProps {
  element: PageBuilderElement;
  deviceType?: DeviceType;
  isPreview?: boolean;
}

export const HeroSliderElement: React.FC<HeroSliderElementProps> = ({
  element,
  deviceType = 'desktop',
  isPreview = false,
}) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const content = element.content as HeroSliderContent;
  const slides = content?.slides || [];
  
  // Merge responsive styles
  const responsiveStyles = element.styles?.responsive || { desktop: {}, mobile: {} };
  const currentResponsiveStyles = responsiveStyles[deviceType] || {};
  const mergedStyles = mergeResponsiveStyles(element.styles || {}, currentResponsiveStyles, deviceType);

  // Generate responsive CSS
  const responsiveCSS = generateResponsiveCSS(element.id, element.styles);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Auto-play functionality
  useEffect(() => {
    if (!api || !content?.autoplay) return;

    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else if (content.loop) {
        api.scrollTo(0);
      }
    }, (content.autoplayDelay || 5) * 1000);

    return () => clearInterval(interval);
  }, [api, content?.autoplay, content?.autoplayDelay, content?.loop]);

  if (!slides.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Add slides to your hero slider</p>
        </div>
      </div>
    );
  }

  const getSlideClasses = () => {
    const baseClasses = "relative w-full transition-all duration-500 ease-in-out";
    
    switch (content?.layout) {
      case 'side-by-side':
        return `${baseClasses} grid grid-cols-1 lg:grid-cols-2 gap-8 items-center`;
      case 'text-only':
        return `${baseClasses} text-center py-20`;
      case 'overlay':
      default:
        return `${baseClasses} relative`;
    }
  };

  const getTextAlignment = () => {
    switch (content?.textAlignment) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      case 'left':
      default:
        return 'text-left';
    }
  };

  const renderSlide = (slide: Slide, index: number) => {
    const isOverlay = content?.layout === 'overlay';
    const isSideBySide = content?.layout === 'side-by-side';
    const isTextOnly = content?.layout === 'text-only';

    return (
      <CarouselItem key={slide.id} className="p-0">
        <div 
          className={getSlideClasses()}
          style={{
            minHeight: mergedStyles.minHeight || '500px',
            ...mergedStyles,
          }}
        >
          {/* Background Image for Overlay Layout */}
          {isOverlay && slide.image && (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ 
                backgroundImage: `url(${slide.image})`,
              }}
            >
              <div 
                className="absolute inset-0 bg-black"
                style={{ opacity: (content?.overlayOpacity || 50) / 100 }}
              />
            </div>
          )}

          {/* Content Container */}
          <div className={cn(
            "relative z-10",
            isOverlay && "flex items-center justify-center min-h-full p-8",
            isSideBySide && "contents",
            isTextOnly && "max-w-4xl mx-auto px-8"
          )}>
            
            {/* Text Content */}
            <div className={cn(
              "space-y-6",
              isOverlay && "max-w-4xl mx-auto text-white",
              isSideBySide && "order-2 lg:order-1",
              getTextAlignment()
            )}>
              {slide.subHeadline && (
                <p className="text-sm font-medium uppercase tracking-wide opacity-80">
                  {slide.subHeadline}
                </p>
              )}
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {slide.headline}
              </h2>
              
              {slide.paragraph && (
                <p className="text-lg md:text-xl opacity-90 max-w-2xl">
                  {slide.paragraph}
                </p>
              )}
              
              {slide.buttonText && (
                <div className="pt-4">
                  <Button 
                    size="lg"
                    className="px-8 py-4 text-lg"
                    onClick={() => {
                      if (slide.buttonUrl && !isPreview) {
                        if (slide.buttonType === 'url') {
                          window.open(slide.buttonUrl, '_blank');
                        }
                      }
                    }}
                  >
                    {slide.buttonText}
                  </Button>
                </div>
              )}
            </div>

            {/* Side Image for Side-by-Side Layout */}
            {isSideBySide && slide.image && (
              <div className="order-1 lg:order-2">
                <img
                  src={slide.image}
                  alt={slide.imageAlt || slide.headline}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>
        </div>
      </CarouselItem>
    );
  };

  return (
    <>
      {responsiveCSS && <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />}
      
      <div className="relative">
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: content?.loop || true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-0">
            {slides.map((slide, index) => renderSlide(slide, index))}
          </CarouselContent>

          {/* Navigation Arrows */}
          {content?.showArrows !== false && slides.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white border-white/20 shadow-lg"
                onClick={() => api?.scrollPrev()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white border-white/20 shadow-lg"
                onClick={() => api?.scrollNext()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </Carousel>

        {/* Dots Indicator */}
        {content?.showDots !== false && slides.length > 1 && (
          <div className="flex justify-center space-x-2 mt-6">
            {slides.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-200",
                  current === index + 1
                    ? "bg-primary scale-110"
                    : "bg-primary/30 hover:bg-primary/50"
                )}
                onClick={() => api?.scrollTo(index)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};