import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderData, PageBuilderElement, PageBuilderSection } from '../types';
import { SectionRenderer } from './SectionRenderer';
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

  const getCanvasStyles = () => {
    const baseStyles = 'transition-all duration-300 mx-auto bg-background';
    
    switch (deviceType) {
      case 'tablet':
        return `${baseStyles} w-[768px] min-h-screen border-x border-border shadow-lg`;
      case 'mobile':
        return `${baseStyles} w-[375px] min-h-screen border-x border-border shadow-lg`;
      default:
        return `${baseStyles} w-full min-h-screen`;
    }
  };

  const handleAddSection = () => {
    if (onAddSection) {
      onAddSection();
    } else {
      console.log('Add section via onAddSection callback needed');
    }
  };

  return (
    <div className="flex-1 p-8 overflow-auto bg-muted/20">
      <div
        ref={drop}
        className={cn(
          getCanvasStyles(),
          isOver && 'ring-2 ring-primary ring-opacity-50',
          isPreviewMode && 'pointer-events-none'
        )}
        onClick={() => !isPreviewMode && onSelectElement(undefined)}
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
                <Button onClick={handleAddSection}>
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
                isSelected={selectedElement?.id === section.id}
                isPreviewMode={isPreviewMode}
                onSelectElement={onSelectElement}
                onUpdateElement={onUpdateElement}
                onAddElement={onAddElement}
                onMoveElement={onMoveElement}
                onRemoveElement={onRemoveElement}
              />
            ))}
            
            {!isPreviewMode && (
              <div className="py-8 text-center">
                <Button variant="outline" onClick={handleAddSection}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>
            )}
          </div>
        )}
        
        {isPreviewMode && (
          <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-3 py-2 rounded-md shadow-lg flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">Preview Mode</span>
          </div>
        )}
      </div>
    </div>
  );
};