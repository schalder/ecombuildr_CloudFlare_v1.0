import React, { useEffect, useState } from 'react';
import { PageBuilderData } from '@/components/page-builder/types';
import { StorefrontSection } from './StorefrontSection';
import { storefrontRegistry } from '../registry/storefrontRegistry';
import { BREAKPOINTS, DeviceType } from '@/components/page-builder/utils/responsive';
import { ensureGoogleFontLoaded } from '@/hooks/useGoogleFontLoader';

interface StorefrontPageBuilderProps {
  data: PageBuilderData;
  className?: string;
  deviceType?: DeviceType;
}

export const StorefrontPageBuilder: React.FC<StorefrontPageBuilderProps> = ({ 
  data, 
  className = '',
  deviceType: propDeviceType
}) => {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isLoading, setIsLoading] = useState(true);

  // Preload page elements on mount
  useEffect(() => {
    const initializePage = async () => {
      try {
        await storefrontRegistry.preloadPageElements(data);
      } catch (error) {
        console.warn('Failed to preload some page elements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (data?.sections) {
      initializePage();
    } else {
      setIsLoading(false);
    }
  }, [data]);

  // Load Google fonts
  useEffect(() => {
    if (!data?.sections) return;

    const usedGoogleFonts = new Set<string>();
    
    const extractFonts = (obj: any) => {
      if (!obj) return;
      
      if (typeof obj === 'object') {
        Object.values(obj).forEach((value: any) => {
          if (typeof value === 'string' && value.includes('"') && 
              (value.includes('Poppins') || value.includes('Montserrat') || 
               value.includes('Roboto') || value.includes('Open Sans') || 
               value.includes('Lato') || value.includes('Playfair Display') || 
               value.includes('Hind Siliguri'))) {
            
            const match = value.match(/"([^"]+)"/);
            if (match) {
              const fontFamily = match[1];
              const fontWeights = {
                'Poppins': '400;500;600;700',
                'Montserrat': '400;500;600;700', 
                'Roboto': '400;500;700',
                'Open Sans': '400;600;700',
                'Lato': '400;700',
                'Playfair Display': '400;700',
                'Hind Siliguri': '300;400;500;600;700'
              };
              
              if (fontWeights[fontFamily as keyof typeof fontWeights]) {
                usedGoogleFonts.add(`${fontFamily}:${fontWeights[fontFamily as keyof typeof fontWeights]}`);
              }
            }
          }
          
          if (typeof value === 'object') {
            extractFonts(value);
          }
        });
      }
    };

    data.sections.forEach(section => {
      extractFonts(section.styles);
      section.rows?.forEach(row => {
        extractFonts(row.styles);
        row.columns?.forEach(column => {
          extractFonts(column.styles);
          column.elements?.forEach(element => {
            extractFonts(element.styles);
            extractFonts(element.content);
          });
        });
      });
    });

    usedGoogleFonts.forEach(fontWithWeights => {
      const [family, weights] = fontWithWeights.split(':');
      ensureGoogleFontLoaded(family, weights);
    });
  }, [data]);

  // Handle responsive design
  useEffect(() => {
    if (propDeviceType) {
      setDeviceType(propDeviceType);
      return;
    }

    const calculateDeviceType = (): DeviceType => {
      const width = window.innerWidth;
      if (width < BREAKPOINTS.md) return 'mobile';
      if (width < BREAKPOINTS.lg) return 'tablet';
      return 'desktop';
    };

    const handleResize = () => {
      setDeviceType(calculateDeviceType());
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [propDeviceType]);

  if (!data) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground">No page data available.</p>
      </div>
    );
  }

  if (!data.sections || !Array.isArray(data.sections) || data.sections.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground">This page is still being set up.</p>
      </div>
    );
  }

  const getPageStyles = () => {
    const styles: React.CSSProperties = {};
    const pageStyles = data.pageStyles;
    
    if (!pageStyles) return styles;
    
    if (pageStyles.backgroundType === 'color' && pageStyles.backgroundColor) {
      styles.backgroundColor = pageStyles.backgroundColor;
    } else if (pageStyles.backgroundType === 'image' && pageStyles.backgroundImage) {
      styles.backgroundImage = `url(${pageStyles.backgroundImage})`;
      styles.backgroundSize = pageStyles.backgroundSize || 'cover';
      styles.backgroundPosition = pageStyles.backgroundPosition || 'center center';
      styles.backgroundRepeat = pageStyles.backgroundRepeat || 'no-repeat';
    }
    
    if (pageStyles.paddingTop) {
      styles.paddingTop = pageStyles.paddingTop === '40px' ? '0px' : pageStyles.paddingTop;
    }
    if (pageStyles.paddingRight) styles.paddingRight = pageStyles.paddingRight;
    if (pageStyles.paddingBottom) styles.paddingBottom = pageStyles.paddingBottom;
    if (pageStyles.paddingLeft) styles.paddingLeft = pageStyles.paddingLeft;
    
    if (pageStyles.marginLeft || pageStyles.marginRight) {
      const ml = pageStyles.marginLeft || '0px';
      const mr = pageStyles.marginRight || '0px';
      styles.marginLeft = 'auto';
      styles.marginRight = 'auto';
      styles.width = `calc(100% - (${ml} + ${mr}))`;
    }
    
    if (pageStyles.marginTop) styles.marginTop = pageStyles.marginTop;
    if (pageStyles.marginBottom) styles.marginBottom = pageStyles.marginBottom;
    
    return styles;
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-64 bg-muted rounded-lg"></div>
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-48 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`storefront-page-content ${className}`} style={getPageStyles()}>
      {data.globalStyles && (
        <style>{`
          .storefront-page-content {
            ${Object.entries(data.globalStyles).map(([key, value]) => `${key}: ${value};`).join(' ')}
          }
        `}</style>
      )}
      
      <div>
        {data.sections.map((section) => (
          <StorefrontSection
            key={section.id}
            section={section}
            deviceType={deviceType}
          />
        ))}
      </div>
    </div>
  );
};