import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderColumn, PageBuilderElement } from '../types';
import { ElementRenderer } from './ElementRenderer';
import { ElementDropZone } from './ElementDropZone';
import { isColumnHidden, getColumnResponsiveClasses } from '../utils/responsive';
import { cn } from '@/lib/utils';
import { renderColumnStyles, hasUserBackground, hasUserShadow } from '../utils/styleRenderer';

interface ColumnRendererProps {
  column: PageBuilderColumn;
  sectionId: string;
  rowId: string;
  columnCount?: number;
  isPreviewMode: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onSelectElement: (element: PageBuilderElement | undefined) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onAddElement: (sectionId: string, rowId: string, columnId: string, elementType: string, insertIndex?: number) => void;
  onRemoveElement: (elementId: string) => void;
  onMoveElement?: (elementId: string, sectionId: string, rowId: string, columnId: string, insertIndex: number) => void;
}

export const ColumnRenderer: React.FC<ColumnRendererProps> = ({
  column,
  sectionId,
  rowId,
  columnCount = 1,
  isPreviewMode,
  deviceType = 'desktop',
  onSelectElement,
  onUpdateElement,
  onAddElement,
  onRemoveElement,
  onMoveElement
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  const [{ isOver }, drop] = isPreviewMode 
    ? [{ isOver: false }, React.useRef(null)]
    : useDrop({
        accept: ['element-type', 'element'],
        drop: (item: { elementType?: string; elementId?: string }, monitor) => {
          if (!monitor.didDrop()) {
            
            if (item.elementType) {
              // Adding new element
              onAddElement(sectionId, rowId, column.id, item.elementType);
            } else if (item.elementId && onMoveElement) {
              // Moving existing element
              onMoveElement(item.elementId, sectionId, rowId, column.id, column.elements.length);
            }
          }
        },
        collect: (monitor) => ({
          isOver: monitor.isOver() && !monitor.didDrop(),
        }),
      });

  const handleColumnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPreviewMode) {
      onSelectElement(column as any);
    }
  };

  const handleAddElement = () => {
    onAddElement(sectionId, rowId, column.id, 'text');
  };

  const getColumnStyles = (): React.CSSProperties => {
    const baseStyles = renderColumnStyles(column, deviceType);
    
    // Add any column-specific overrides
    if (column.customWidth) {
      if (deviceType === 'tablet' || deviceType === 'mobile') {
        baseStyles.maxWidth = column.customWidth;
        baseStyles.width = '100%';
        baseStyles.flexBasis = '100%';
        baseStyles.flexGrow = 0;
        baseStyles.flexShrink = 1;
        // Apply auto margins for centering on tablet/mobile
        baseStyles.marginLeft = 'auto';
        baseStyles.marginRight = 'auto';
      } else {
        baseStyles.width = column.customWidth;
        baseStyles.flexBasis = column.customWidth;
        baseStyles.flexGrow = 0;
        baseStyles.flexShrink = 0;
      }
    }
    
    return baseStyles;
  };

  // Check if column should be hidden on current device
  if (isColumnHidden(column, deviceType)) {
    return null;
  }

  // Hide empty columns on mobile in preview/live mode
  if (deviceType === 'mobile' && isPreviewMode && column.elements.length === 0) {
    return null;
  }

  const userBackground = hasUserBackground(column.styles);
  const userShadow = hasUserShadow(column.styles);

  return (
    <div
      ref={drop}
      id={column.anchor}
      data-pb-column-id={column.id}
      className={cn(
        'relative transition-colors',
        // Apply min-height only when empty and not in preview mode
        !isPreviewMode && column.elements.length === 0 && 'min-h-[60px]',
        // Only apply border/background styles if not in preview mode - solid borders
        !isPreviewMode && 'border-2 border-dashed border-gray-300',
        !isPreviewMode && isOver && 'border-primary/60',
        !isPreviewMode && isOver && !userBackground && 'bg-primary/5',
        !isPreviewMode && isHovered && 'border-primary/50',
        getColumnResponsiveClasses(column, deviceType)
      )}
      style={getColumnStyles()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleColumnClick}
    >
      {/* Column Controls */}
      {!isPreviewMode && isHovered && column.elements.length === 0 && (
        <div className="absolute -top-6 left-0 flex items-center space-x-1 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs z-10">
          <GripVertical className="h-3 w-3" />
          <span>Column</span>
        </div>
      )}

      {column.elements.length === 0 ? (
        <div className="min-h-[60px] flex items-center justify-center">
          {!isPreviewMode && (
            <Button variant="ghost" size="sm" onClick={handleAddElement} className="text-muted-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Element
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-0">
          {column.elements.map((element, index) => (
            <div key={element.id} className="relative">
              {/* Drop zone above element */}
              {!isPreviewMode && (
                <ElementDropZone
                  sectionId={sectionId}
                  rowId={rowId}
                  columnId={column.id}
                  insertIndex={index}
                  onAddElement={(elementType, insertIndex) => {
                    
                    onAddElement(sectionId, rowId, column.id, elementType, insertIndex);
                  }}
                  onMoveElement={onMoveElement ? (elementId, insertIndex) => {
                    onMoveElement(elementId, sectionId, rowId, column.id, insertIndex);
                  } : undefined}
                />
              )}
              
              <ElementRenderer
                element={element}
                isPreviewMode={isPreviewMode}
                deviceType={deviceType}
                columnCount={columnCount}
                onSelectElement={onSelectElement}
                onUpdateElement={onUpdateElement}
                onRemoveElement={onRemoveElement}
                sectionId={sectionId}
                rowId={rowId}
                columnId={column.id}
                elementIndex={index}
                onMoveElement={onMoveElement}
              />
            </div>
          ))}
          
          {/* Drop zone after last element */}
          {!isPreviewMode && column.elements.length > 0 && (
            <ElementDropZone
              sectionId={sectionId}
              rowId={rowId}
              columnId={column.id}
              insertIndex={column.elements.length}
              onAddElement={(elementType, insertIndex) => {
                
                onAddElement(sectionId, rowId, column.id, elementType, insertIndex);
              }}
              onMoveElement={onMoveElement ? (elementId, insertIndex) => {
                onMoveElement(elementId, sectionId, rowId, column.id, insertIndex);
              } : undefined}
            />
          )}
        </div>
      )}
    </div>
  );
};