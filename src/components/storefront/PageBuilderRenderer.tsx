import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PageBuilderData } from '@/components/page-builder/types';
import { SectionRenderer } from '@/components/page-builder/components/SectionRenderer';
import { BREAKPOINTS, DeviceType } from '@/components/page-builder/utils/responsive';
// Ensure elements are registered on storefront render too
import '@/components/page-builder/elements';
import { elementRegistry } from '@/components/page-builder/elements';

interface PageBuilderRendererProps {
  data: PageBuilderData;
  className?: string;
  deviceType?: DeviceType;
}

export const PageBuilderRenderer: React.FC<PageBuilderRendererProps> = ({ 
  data, 
  className = '',
  deviceType: propDeviceType
}) => {
  const [deviceType, setDeviceType] = React.useState<DeviceType>('desktop');

  React.useEffect(() => {
    if (propDeviceType) {
      // Use prop device type for preview mode
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
      const next = calculateDeviceType();
      setDeviceType(next);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [propDeviceType]);

  React.useEffect(() => {
    const ids = elementRegistry.getAll().map(e => e.id);
    
  }, []);

  
  
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
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Data keys: {Object.keys(data).join(', ')}</p>
          <p>Sections type: {typeof data.sections}</p>
          <p>Sections length: {Array.isArray(data.sections) ? data.sections.length : 'Not an array'}</p>
        </div>
      </div>
    );
  }

  const getPageStyles = () => {
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

  const content = (
    <div className={`page-builder-content ${className}`} style={getPageStyles()}>
      {/* Apply global styles if they exist */}
      {data.globalStyles && (
        <style>{`
          .page-builder-content {
            ${Object.entries(data.globalStyles).map(([key, value]) => `${key}: ${value};`).join(' ')}
          }
        `}</style>
      )}
      
      {/* Render sections in preview mode for storefront */}
      <div className="space-y-0">
        {data.sections.map((section, index) => (
          <SectionRenderer
            key={section.id}
            section={section}
            sectionIndex={index}
            isSelected={false}
            isPreviewMode={true}
            deviceType={deviceType}
            onSelectElement={() => {}}
            onUpdateElement={() => {}}
            onAddElement={() => {}}
            onRemoveElement={() => {}}
            onMoveElement={() => {}}
            onAddSectionAfter={() => {}}
            onAddRowAfter={() => {}}
          />
        ))}
      </div>
    </div>
  );

  // For published pages, don't wrap in DndProvider to avoid drag-and-drop behavior
  return content;
};