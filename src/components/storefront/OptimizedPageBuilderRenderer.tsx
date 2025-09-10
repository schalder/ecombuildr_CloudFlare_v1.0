import React from 'react';
import { PageBuilderData } from '@/components/page-builder/types';
import { DeviceType, BREAKPOINTS } from '@/components/page-builder/utils/responsive';
import { OptimizedSectionRenderer } from './OptimizedSectionRenderer';
import { ensureGoogleFontLoaded } from '@/hooks/useGoogleFontLoader';

interface OptimizedPageBuilderRendererProps {
  data: PageBuilderData;
  className?: string;
  deviceType?: DeviceType;
}

export const OptimizedPageBuilderRenderer: React.FC<OptimizedPageBuilderRendererProps> = React.memo(({ 
  data, 
  className = '',
  deviceType: propDeviceType
}) => {
  const [deviceType, setDeviceType] = React.useState<DeviceType>('desktop');

  // Optimized font loading with better extraction
  React.useEffect(() => {
    if (!data?.sections) return;

    const fontFamilies = new Set<string>();
    
    const extractFonts = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.values(obj).forEach((value: any) => {
        if (typeof value === 'string' && value.includes('font-family')) {
          const match = value.match(/font-family:\s*["']([^"']+)["']/);
          if (match) fontFamilies.add(match[1]);
        } else if (typeof value === 'object') {
          extractFonts(value);
        }
      });
    };

    data.sections.forEach(section => {
      extractFonts(section);
    });

    // Load Google fonts with preconnect optimization
    fontFamilies.forEach(family => {
      if (['Poppins', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Playfair Display', 'Hind Siliguri'].includes(family)) {
        ensureGoogleFontLoaded(family, '400;500;600;700');
      }
    });
  }, [data]);

  // Responsive device detection with throttling
  React.useEffect(() => {
    if (propDeviceType) {
      setDeviceType(propDeviceType);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const newType = width < BREAKPOINTS.md ? 'mobile' : 
                       width < BREAKPOINTS.lg ? 'tablet' : 'desktop';
        setDeviceType(newType);
      }, 100);
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [propDeviceType]);

  if (!data?.sections?.length) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground">This page is being set up.</p>
      </div>
    );
  }

  const pageStyles = React.useMemo(() => {
    const styles: React.CSSProperties = {};
    const { pageStyles: ps } = data;
    
    if (!ps) return styles;
    
    if (ps.backgroundType === 'color' && ps.backgroundColor) {
      styles.backgroundColor = ps.backgroundColor;
    } else if (ps.backgroundType === 'image' && ps.backgroundImage) {
      styles.backgroundImage = `url(${ps.backgroundImage})`;
      styles.backgroundSize = ps.backgroundSize || 'cover';
      styles.backgroundPosition = ps.backgroundPosition || 'center';
      styles.backgroundRepeat = ps.backgroundRepeat || 'no-repeat';
    }
    
    if (ps.paddingTop && ps.paddingTop !== '40px') styles.paddingTop = ps.paddingTop;
    if (ps.paddingRight) styles.paddingRight = ps.paddingRight;
    if (ps.paddingBottom) styles.paddingBottom = ps.paddingBottom;
    if (ps.paddingLeft) styles.paddingLeft = ps.paddingLeft;
    
    if (ps.marginLeft || ps.marginRight) {
      styles.marginLeft = 'auto';
      styles.marginRight = 'auto';
      styles.width = `calc(100% - (${ps.marginLeft || '0px'} + ${ps.marginRight || '0px'}))`;
    }
    
    if (ps.marginTop) styles.marginTop = ps.marginTop;
    if (ps.marginBottom) styles.marginBottom = ps.marginBottom;
    
    return styles;
  }, [data.pageStyles]);

  return (
    <div className={`page-builder-content ${className}`} style={pageStyles}>
      {data.globalStyles && (
        <style>{`
          .page-builder-content {
            ${Object.entries(data.globalStyles).map(([key, value]) => `${key}: ${value};`).join(' ')}
          }
        `}</style>
      )}
      
      <div className="space-y-0">
        {data.sections.map((section, index) => (
          <OptimizedSectionRenderer
            key={`${section.id}-${index}`}
            section={section}
            deviceType={deviceType}
          />
        ))}
      </div>
    </div>
  );
});

OptimizedPageBuilderRenderer.displayName = 'OptimizedPageBuilderRenderer';