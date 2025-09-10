import React from 'react';
import { PageBuilderData } from '@/components/page-builder/types';
import { StorefrontSectionRenderer } from './StorefrontSectionRenderer';
import { BREAKPOINTS, DeviceType } from '@/components/page-builder/utils/responsive';
import { ensureGoogleFontLoaded } from '@/hooks/useGoogleFontLoader';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface StorefrontPageBuilderRendererProps {
  data: PageBuilderData;
  className?: string;
  deviceType?: DeviceType;
}

export const StorefrontPageBuilderRenderer: React.FC<StorefrontPageBuilderRendererProps> = ({ 
  data, 
  className = '',
  deviceType: propDeviceType
}) => {
  const [deviceType, setDeviceType] = React.useState<DeviceType>('desktop');

  // Extract and load all Google fonts used in the page (optimized)
  React.useEffect(() => {
    if (!data?.sections) return;

    const usedGoogleFonts = new Set<string>();
    
    // Optimized font extraction
    const extractFonts = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      for (const value of Object.values(obj)) {
        if (typeof value === 'string' && value.includes('"')) {
          const match = value.match(/"([^"]+)"/);
          if (match) {
            const fontFamily = match[1];
            const fontWeights: Record<string, string> = {
              'Poppins': '400;500;600;700',
              'Montserrat': '400;500;600;700', 
              'Roboto': '400;500;700',
              'Open Sans': '400;600;700',
              'Lato': '400;700',
              'Playfair Display': '400;700',
              'Hind Siliguri': '300;400;500;600;700'
            };
            
            if (fontWeights[fontFamily]) {
              usedGoogleFonts.add(`${fontFamily}:${fontWeights[fontFamily]}`);
            }
          }
        }
        
        if (typeof value === 'object') {
          extractFonts(value);
        }
      }
    };

    // Extract fonts from page data
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

    // Load all found Google fonts
    usedGoogleFonts.forEach(fontWithWeights => {
      const [family, weights] = fontWithWeights.split(':');
      ensureGoogleFontLoaded(family, weights);
    });
  }, [data]);

  React.useEffect(() => {
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

  const getPageStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    const pageStyles = data.pageStyles;
    
    if (!pageStyles) return styles;
    
    // Background handling
    if (pageStyles.backgroundType === 'color' && pageStyles.backgroundColor) {
      styles.backgroundColor = pageStyles.backgroundColor;
    } else if (pageStyles.backgroundType === 'image' && pageStyles.backgroundImage) {
      styles.backgroundImage = `url(${pageStyles.backgroundImage})`;
      styles.backgroundSize = pageStyles.backgroundSize || 'cover';
      styles.backgroundPosition = pageStyles.backgroundPosition || 'center center';
      styles.backgroundRepeat = pageStyles.backgroundRepeat || 'no-repeat';
    }
    
    // Padding - normalize legacy 40px paddingTop to 0px
    if (pageStyles.paddingTop) {
      styles.paddingTop = pageStyles.paddingTop === '40px' ? '0px' : pageStyles.paddingTop;
    }
    if (pageStyles.paddingRight) styles.paddingRight = pageStyles.paddingRight;
    if (pageStyles.paddingBottom) styles.paddingBottom = pageStyles.paddingBottom;
    if (pageStyles.paddingLeft) styles.paddingLeft = pageStyles.paddingLeft;
    
    // Margin and width calculation for centering
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
    <ErrorBoundary fallback={({ retry }) => <div className="text-center py-12">Content rendering error</div>}>
      <div className={`page-builder-content ${className}`} style={getPageStyles()}>
        {/* Apply global styles if they exist */}
        {data.globalStyles && (
          <style>{`
            .page-builder-content {
              ${Object.entries(data.globalStyles).map(([key, value]) => `${key}: ${value};`).join(' ')}
            }
          `}</style>
        )}
        
        {/* Render sections in optimized storefront mode */}
        <div className="space-y-0">
          {data.sections.map((section, index) => (
            <StorefrontSectionRenderer
              key={section.id}
              section={section}
              sectionIndex={index}
              deviceType={deviceType}
            />
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
};