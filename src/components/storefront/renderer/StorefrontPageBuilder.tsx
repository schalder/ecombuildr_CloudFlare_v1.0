import React, { useEffect, useState, useMemo } from 'react';
import { PageBuilderData } from '@/components/page-builder/types';
import { StorefrontSection } from './StorefrontSection';
import { storefrontRegistry } from '../registry/storefrontRegistry';
import { BREAKPOINTS, DeviceType } from '@/components/page-builder/utils/responsive';
import { CriticalResourceLoader } from '../optimized/CriticalResourceLoader';
import { FontOptimizer } from '../optimized/FontOptimizer';
import { ScriptManager } from '../optimized/ScriptManager';
import { PerformanceMonitor } from '../optimized/PerformanceMonitor';
import { ServiceWorkerManager } from '../optimized/ServiceWorkerManager';
import { CriticalImageManager } from '../optimized/CriticalImageManager';

interface StorefrontPageBuilderProps {
  data: PageBuilderData;
  className?: string;
  deviceType?: DeviceType;
  customScripts?: string;
}

export const StorefrontPageBuilder: React.FC<StorefrontPageBuilderProps> = ({ 
  data, 
  className = '',
  deviceType: propDeviceType,
  customScripts
}) => {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  // Preload page elements on mount (non-blocking - render content immediately)
  useEffect(() => {
    if (!data?.sections) return;

    // Defer non-critical element preloading to avoid blocking render
    const initializePage = async () => {
      try {
        // Phase 1: Load critical above-fold elements (non-blocking)
        storefrontRegistry.preloadCriticalElements().catch(err => 
          console.warn('Failed to preload critical elements:', err)
        );
        
        // Phase 2: Preload page-specific elements (deferred to idle time)
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            storefrontRegistry.preloadPageElements(data).catch(err => 
              console.warn('Failed to preload some page elements:', err)
            );
          }, { timeout: 2000 });
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => {
            storefrontRegistry.preloadPageElements(data).catch(err => 
              console.warn('Failed to preload some page elements:', err)
            );
          }, 100);
        }
      } catch (error) {
        console.warn('Failed to load critical elements:', error);
      }
    };

    initializePage();
  }, [data]);

  // Extract critical resources synchronously (before render) for optimal Lighthouse scores
  const criticalResources = useMemo(() => {
    if (!data?.sections) {
      return { heroImage: undefined, fonts: [], preloadImages: [] };
    }

    const heroImage = data.sections?.[0]?.rows?.[0]?.columns?.[0]?.elements?.find(
      el => el.type === 'image'
    )?.content?.src;
    
    const usedFonts = new Set<string>();
    const preloadImages: string[] = [];
    
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
              usedFonts.add(fontFamily);
            }
          }
          
          if (typeof value === 'object') {
            extractFonts(value);
          }
        });
      }
    };

    // Extract fonts and images from first 2 sections (above fold)
    data.sections.slice(0, 2).forEach(section => {
      extractFonts(section.styles);
      section.rows?.forEach(row => {
        extractFonts(row.styles);
        row.columns?.forEach(column => {
          extractFonts(column.styles);
          column.elements?.forEach(element => {
            extractFonts(element.styles);
            extractFonts(element.content);
            
            if (element.type === 'image' && element.content?.src) {
              preloadImages.push(element.content.src);
            }
          });
        });
      });
    });
    
    return {
      heroImage,
      fonts: Array.from(usedFonts),
      preloadImages: preloadImages.slice(0, 3) // Limit to first 3 images
    };
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


  return (
    <CriticalImageManager maxCriticalImages={3}>
      {/* Critical resource optimization */}
      <CriticalResourceLoader 
        heroImage={criticalResources.heroImage}
        primaryFonts={criticalResources.fonts}
        preloadImages={criticalResources.preloadImages}
      />
      <FontOptimizer fonts={criticalResources.fonts} />
      <ScriptManager customScripts={customScripts} defer={true} />
      <PerformanceMonitor page="storefront" enabled={process.env.NODE_ENV === 'development'} />
      <ServiceWorkerManager enabled={process.env.NODE_ENV === 'production'} />
      
      <div className={`storefront-page-content ${className}`} style={getPageStyles()}>
        {data.globalStyles && (
          <style>{`
            .storefront-page-content {
              ${Object.entries(data.globalStyles).map(([key, value]) => `${key}: ${value};`).join(' ')}
            }
          `}</style>
        )}
        
        <div className="space-y-0">
          {data.sections.map((section) => (
            <StorefrontSection
              key={section.id}
              section={section}
              deviceType={deviceType}
            />
          ))}
        </div>
      </div>
    </CriticalImageManager>
  );
};