import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderData, PageBuilderElement, PageBuilderSection } from '../types';
import { SectionRenderer } from './SectionRenderer';
import { getDevicePreviewStyles, getResponsiveContainerClasses } from '../utils/responsive';
import { cn } from '@/lib/utils';

interface CanvasAreaProps {
  pageData: PageBuilderData;
  selectedElement?: PageBuilderElement;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  isPreviewMode: boolean;
  onSelectElement: (element: PageBuilderElement | undefined) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onAddElement: (sectionId: string, rowId: string, columnId: string, elementType: string, insertIndex?: number) => void;
  onMoveElement?: (elementId: string, sectionId: string, rowId: string, columnId: string, insertIndex: number) => void;
  onRemoveElement: (elementId: string) => void;
  onAddSection?: () => void;
  onAddRow?: (sectionId: string) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  pageData,
  selectedElement,
  deviceType,
  isPreviewMode,
  onSelectElement,
  onUpdateElement,
  onAddElement,
  onMoveElement,
  onRemoveElement,
  onAddSection,
  onAddRow
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'element',
    drop: (item: { elementType: string }) => {
      // For canvas area drops, we need to add to first available section/row/column
      console.log('Canvas drop - not implemented for direct element drops');
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const getCanvasClasses = () => {
    const baseClasses = 'transition-all duration-300 min-h-screen';
    
    if (deviceType === 'desktop') {
      return `${baseClasses} w-full`;
    }
    
    return `${baseClasses} border border-border shadow-lg rounded-lg mx-auto`;
  };

  const getCanvasStyles = () => {
    const styles: React.CSSProperties = {};
    const pageStyles = pageData.pageStyles;
    
    if (!pageStyles) return styles;
    
    // Background handling
    if (pageStyles.backgroundType === 'color' && pageStyles.backgroundColor) {
      styles.backgroundColor = pageStyles.backgroundColor;
    } else if (pageStyles.backgroundType === 'image' && pageStyles.backgroundImage) {
      styles.backgroundImage = `url(${pageStyles.backgroundImage})`;
      styles.backgroundSize = pageStyles.backgroundSize || 'cover';
      styles.backgroundPosition = pageStyles.backgroundPosition || 'center center';
      styles.backgroundRepeat = pageStyles.backgroundRepeat || 'no-repeat';
    } else {
      styles.backgroundColor = 'hsl(var(--background))';
    }
    
    // Padding
    if (pageStyles.paddingTop) styles.paddingTop = pageStyles.paddingTop;
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

  const handleAddSection = () => {
    if (onAddSection) {
      onAddSection();
    } else {
      console.log('Add section via onAddSection callback needed');
    }
  };

  return (
    <div className="flex-1 p-8 overflow-auto bg-muted/20 canvas-container">
      <div
        ref={drop}
        data-canvas-area="true"
        data-testid="canvas-area"
        className={cn(
          'canvas-area page-builder-canvas',
          getCanvasClasses(),
          isOver && 'ring-2 ring-primary ring-opacity-50',
          isPreviewMode && 'pointer-events-none'
        )}
        style={{ ...getDevicePreviewStyles(deviceType), ...getCanvasStyles() }}
        onClick={() => !isPreviewMode && onSelectElement(undefined)}
      >
        {/* Content area wrapper for clean preview capture */}
        <div 
          data-content-area="true" 
          className="page-content-area"
          style={{ minHeight: pageData.sections.length === 0 ? '400px' : 'auto' }}
        >
          {pageData.sections.length === 0 ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Start building your page</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Drag elements from the left panel or click the button below to add your first section.
                </p>
                {!isPreviewMode && (
                  <Button onClick={handleAddSection} data-builder-ui="true">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-0">
               {pageData.sections.map((section, index) => (
                 <SectionRenderer
                   key={section.id}
                   section={section}
                   sectionIndex={index}
                   isSelected={selectedElement?.id === section.id}
                   isPreviewMode={isPreviewMode}
                   deviceType={deviceType}
                   onSelectElement={onSelectElement}
                   onUpdateElement={onUpdateElement}
                   onAddElement={onAddElement}
                   onMoveElement={onMoveElement}
                   onRemoveElement={onRemoveElement}
                   onAddSectionAfter={() => {}}
                   onAddRowAfter={() => {}}
                 />
               ))}
            </div>
          )}
        </div>
        
        {/* Builder UI elements - separate from content area */}
        {!isPreviewMode && pageData.sections.length > 0 && (
          <div className="py-8 text-center" data-builder-ui="true">
            <Button variant="outline" onClick={handleAddSection}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        )}
        
        {isPreviewMode && (
          <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-3 py-2 rounded-md shadow-lg flex items-center space-x-2" data-builder-ui="true">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">Preview Mode</span>
          </div>
        )}
      </div>
    </div>
  );
};