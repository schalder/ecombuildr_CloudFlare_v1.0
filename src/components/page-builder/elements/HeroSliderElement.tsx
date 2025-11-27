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
  const [isAnimating, setIsAnimating] = useState(false);

  const content = element.content as HeroSliderContent;
  const slides = content?.slides || [];
  
  // Merge responsive styles with base styles
  const mergedStyles = mergeResponsiveStyles({}, element.styles, deviceType);

  // Generate responsive CSS
  const responsiveCSS = generateResponsiveCSS(element.id, element.styles);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    
    // Trigger animation on initial load
    setIsAnimating(false);
    setTimeout(() => setIsAnimating(true), 50);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
      // Trigger animation on slide change
      setIsAnimating(false);
      setTimeout(() => setIsAnimating(true), 50);
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
        return `${baseClasses} grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 items-center px-4 md:px-8 lg:px-16`;
      case 'text-only':
        return `${baseClasses} py-12 md:py-20 px-4 md:px-8`;
      case 'overlay':
      default:
        return `${baseClasses} relative flex items-center justify-center min-h-full`;
    }
  };

  const getTextAlignment = () => {
    // Force center alignment on mobile for better UX
    if (deviceType === 'mobile') {
      return 'text-center';
    }
    
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

    // Get style values from merged styles (responsive + base styles)
    const getStyleValue = (property: string, fallback?: string) => {
      return mergedStyles[property] || fallback;
    };

    // Typography styles with mobile responsiveness
    const subHeadlineStyles = {
      fontSize: getStyleValue('subHeadlineFontSize', deviceType === 'mobile' ? '12px' : '14px'),
      color: getStyleValue('subHeadlineColor'),
    };

    const headlineStyles = {
      fontSize: getStyleValue('headlineFontSize', deviceType === 'mobile' ? '32px' : '48px'),
      color: getStyleValue('headlineColor'),
    };

    const paragraphStyles = {
      fontSize: getStyleValue('paragraphFontSize', deviceType === 'mobile' ? '16px' : '18px'),
      color: getStyleValue('paragraphColor'),
    };

    // Button styles
    const buttonSize = getStyleValue('buttonSize', 'lg') as any;
    const buttonStyles = {
      fontSize: getStyleValue('buttonFontSize', '16px'),
      backgroundColor: getStyleValue('buttonBackgroundColor'),
      color: getStyleValue('buttonTextColor'),
    };

    return (
      <CarouselItem key={slide.id} className="p-0 shadow-none border-none" style={{ boxShadow: 'none' }}>
        <div 
          className={cn(
            getSlideClasses(),
            deviceType === 'mobile' && "flex flex-col items-center justify-center"
          )}
          style={{
            minHeight: mergedStyles.minHeight || (deviceType === 'mobile' ? '300px' : '500px'),
            maxWidth: mergedStyles.maxWidth || (deviceType === 'mobile' ? '100%' : undefined),
            width: deviceType === 'mobile' ? '100%' : undefined,
            borderWidth: mergedStyles.borderWidth,
            borderColor: mergedStyles.borderColor,
            borderRadius: mergedStyles.borderRadius,
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
            "relative z-10 w-full",
            isOverlay && "max-w-full md:max-w-4xl mx-auto text-white p-4 md:p-8 flex flex-col items-center justify-center",
            isSideBySide && "contents",
            isTextOnly && "max-w-full md:max-w-4xl mx-auto flex flex-col items-center justify-center"
          )}>
            
            {/* Text Content */}
            <div className={cn(
              "space-y-6 w-full",
              isSideBySide && "order-2 lg:order-1",
              getTextAlignment(),
              deviceType === 'mobile' && "flex flex-col items-center"
            )}>
              {slide.subHeadline && (
                <p 
                  className={cn(
                    "font-medium uppercase tracking-wide opacity-80",
                    deviceType === 'mobile' && "text-center w-full px-4",
                    current === index + 1 && isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  )}
                  style={{
                    fontSize: subHeadlineStyles.fontSize,
                    color: subHeadlineStyles.color || (isOverlay ? 'inherit' : 'currentColor'),
                    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                    transitionDelay: '0.2s',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  {slide.subHeadline}
                </p>
              )}
              
              <h2 
                className={cn(
                  "font-bold leading-tight",
                  deviceType === 'mobile' && "text-center w-full px-4",
                  current === index + 1 && isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{
                  fontSize: headlineStyles.fontSize,
                  color: headlineStyles.color || (isOverlay ? 'inherit' : 'currentColor'),
                  transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                  transitionDelay: '0.4s',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {slide.headline}
              </h2>
              
              {slide.paragraph && (
                <p 
                  className={cn(
                    "opacity-90",
                    deviceType === 'mobile' ? "text-center mx-auto w-full px-4" : (
                      content?.textAlignment === 'center' && "mx-auto max-w-2xl",
                      content?.textAlignment === 'right' && "ml-auto max-w-2xl",
                      content?.textAlignment === 'left' && "mr-auto max-w-2xl"
                    ),
                    current === index + 1 && isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  )}
                  style={{
                    fontSize: paragraphStyles.fontSize,
                    color: paragraphStyles.color || (isOverlay ? 'inherit' : 'currentColor'),
                    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                    transitionDelay: '0.6s',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  {slide.paragraph}
                </p>
              )}
              
              {slide.buttonText && (
                <div className={cn(
                  "pt-4",
                  deviceType === 'mobile' ? "flex justify-center" : (
                    content?.textAlignment === 'center' && "flex justify-center",
                    content?.textAlignment === 'right' && "flex justify-end",
                    content?.textAlignment === 'left' && "flex justify-start"
                  )
                )}>
                  <Button 
                    size={buttonSize}
                    className={cn(
                      "px-8 py-4",
                      current === index + 1 && isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    )}
                    style={{
                      fontSize: buttonStyles.fontSize,
                      backgroundColor: buttonStyles.backgroundColor || undefined,
                      color: buttonStyles.color || undefined,
                      transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                      transitionDelay: '0.8s',
                    }}
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
      <style dangerouslySetInnerHTML={{ 
        __html: `
          .embla__slide { 
            box-shadow: none !important; 
            border: none !important; 
          }
          .embla__container { 
            box-shadow: none !important; 
          }
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-slide-in-up {
            animation: slideInUp 0.6s ease-out forwards;
          }
        ` 
      }} />
      
      <div 
        className={cn(
          `element-${element.id} relative overflow-hidden`,
          deviceType === 'mobile' && "w-full flex flex-col items-center"
        )}
        style={{
          backgroundColor: mergedStyles.backgroundColor,
          opacity: mergedStyles.opacity,
          boxShadow: mergedStyles.boxShadow,
          transform: mergedStyles.transform,
          width: deviceType === 'mobile' ? '100%' : undefined,
        }}
      >
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: content?.loop || true,
          }}
          className="w-full overflow-hidden"
        >
          <CarouselContent className="-ml-0 shadow-none"
            style={{ boxShadow: 'none' }}
          >
            {slides.map((slide, index) => renderSlide(slide, index))}
          </CarouselContent>

          {/* Navigation Arrows */}
          {content?.showArrows !== false && slides.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white border-white/20 shadow-lg",
                  deviceType === 'mobile' ? "left-2" : "left-4"
                )}
                onClick={() => api?.scrollPrev()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white border-white/20 shadow-lg",
                  deviceType === 'mobile' ? "right-2" : "right-4"
                )}
                onClick={() => api?.scrollNext()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </Carousel>

        {/* Dots Indicator */}
        {content?.showDots !== false && slides.length > 1 && (
          <div className="flex justify-center items-center gap-3 mt-6">
            {slides.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-200 flex-shrink-0",
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