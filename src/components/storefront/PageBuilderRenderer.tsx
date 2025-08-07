import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PageBuilderData } from '@/components/page-builder/types';
import { SectionRenderer } from '@/components/page-builder/components/SectionRenderer';
import { BREAKPOINTS, DeviceType } from '@/components/page-builder/utils/responsive';

interface PageBuilderRendererProps {
  data: PageBuilderData;
  className?: string;
}

export const PageBuilderRenderer: React.FC<PageBuilderRendererProps> = ({ 
  data, 
  className = '' 
}) => {
  const [deviceType, setDeviceType] = React.useState<DeviceType>('desktop');

  React.useEffect(() => {
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
  }, []);

  console.log('PageBuilderRenderer: Received data:', data);
  
  if (!data) {
    console.log('PageBuilderRenderer: No data provided');
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground">No page data available.</p>
      </div>
    );
  }

  if (!data.sections || !Array.isArray(data.sections) || data.sections.length === 0) {
    console.log('PageBuilderRenderer: No sections found or sections is not an array:', data.sections);
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

  const content = (
    <div className={`page-builder-content ${className}`}>
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