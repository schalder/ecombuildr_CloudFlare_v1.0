import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Trash2, Copy, Settings, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderSection, PageBuilderElement } from '../types';
import { RowRenderer } from './RowRenderer';
import { RowDropZone } from './RowDropZone';
import { cn } from '@/lib/utils';

interface SectionRendererProps {
  section: PageBuilderSection;
  isSelected: boolean;
  isPreviewMode: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onSelectElement: (element: PageBuilderElement | undefined) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onAddElement: (sectionId: string, rowId: string, columnId: string, elementType: string, insertIndex?: number) => void;
  onMoveElement?: (elementId: string, sectionId: string, rowId: string, columnId: string, insertIndex: number) => void;
  onRemoveElement: (elementId: string) => void;
  onAddRow?: (sectionId: string, columnLayout: string, insertIndex: number) => void;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  isSelected,
  isPreviewMode,
  deviceType = 'desktop',
  onSelectElement,
  onUpdateElement,
  onAddElement,
  onMoveElement,
  onRemoveElement,
  onAddRow
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'element',
    drop: (item: { elementType: string }) => {
      // For now, sections don't directly accept elements - they get rows
      console.log('Section drop - not implemented for direct elements');
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleSectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPreviewMode) {
      onSelectElement(section as any);
    }
  };

  const handleAddRow = () => {
    // This would need a different callback for adding rows to sections
    console.log('Add row to section - needs separate callback');
  };

  const handleDeleteSection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveElement(section.id);
  };

  const handleDuplicateSection = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement section duplication
  };

  const getSectionWidth = () => {
    // If custom width is set, don't apply preset classes
    if (section.customWidth) {
      return '';
    }
    
    if (deviceType === 'tablet') {
      switch (section.width) {
        case 'full':
          return 'w-full';
        case 'wide':
          return 'w-full px-4';
        case 'medium':
          return 'max-w-lg mx-auto px-4';
        case 'small':
          return 'max-w-sm mx-auto px-4';
        default:
          return 'w-full px-4';
      }
    }
    
    if (deviceType === 'mobile') {
      switch (section.width) {
        case 'full':
          return 'w-full px-2';
        case 'wide':
          return 'w-full px-3';
        case 'medium':
          return 'w-full px-4';
        case 'small':
          return 'w-full px-6';
        default:
          return 'w-full px-4';
      }
    }
    
    // Desktop (default)
    switch (section.width) {
      case 'full':
        return 'w-full';
      case 'wide':
        return 'max-w-7xl mx-auto px-4';
      case 'medium':
        return 'max-w-4xl mx-auto px-4';
      case 'small':
        return 'max-w-2xl mx-auto px-4';
      default:
        return 'max-w-7xl mx-auto px-4';
    }
  };

  const getSectionStyles = () => {
    const styles: React.CSSProperties = {
      backgroundColor: section.styles?.backgroundColor || 'transparent',
    };

    // Custom width override
    if (section.customWidth) {
      styles.width = section.customWidth;
      styles.maxWidth = section.styles?.maxWidth || 'none';
      styles.minWidth = section.styles?.minWidth || 'auto';
    } else if (section.styles?.maxWidth || section.styles?.minWidth) {
      if (section.styles.maxWidth) styles.maxWidth = section.styles.maxWidth;
      if (section.styles.minWidth) styles.minWidth = section.styles.minWidth;
    }

    // Advanced spacing - use individual properties if available, otherwise fallback to combined
    if (section.styles?.paddingTop || section.styles?.paddingRight || section.styles?.paddingBottom || section.styles?.paddingLeft) {
      styles.paddingTop = section.styles.paddingTop || '0';
      styles.paddingRight = section.styles.paddingRight || '0';
      styles.paddingBottom = section.styles.paddingBottom || '0';
      styles.paddingLeft = section.styles.paddingLeft || '0';
    } else if (section.styles?.padding) {
      styles.padding = section.styles.padding;
    }

    if (section.styles?.marginTop || section.styles?.marginRight || section.styles?.marginBottom || section.styles?.marginLeft) {
      styles.marginTop = section.styles.marginTop || '0';
      styles.marginRight = section.styles.marginRight || '0';
      styles.marginBottom = section.styles.marginBottom || '0';
      styles.marginLeft = section.styles.marginLeft || '0';
    } else if (section.styles?.margin) {
      styles.margin = section.styles.margin;
    }

    // Background image
    if (section.styles?.backgroundImage) {
      styles.backgroundImage = `url(${section.styles.backgroundImage})`;
      styles.backgroundSize = 'cover';
      styles.backgroundPosition = 'center';
      styles.backgroundRepeat = 'no-repeat';
    }

    return styles;
  };

  return (
    <div
      ref={drop}
      className={cn(
        'relative group',
        isSelected && !isPreviewMode && 'ring-2 ring-primary ring-opacity-50',
        isOver && 'bg-primary/5'
      )}
      style={getSectionStyles()}
      onClick={handleSectionClick}
    >
      {/* Section Controls */}
      {!isPreviewMode && isSelected && (
        <div className="absolute -top-10 left-0 flex items-center space-x-1 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs z-10">
          <GripVertical className="h-3 w-3" />
          <span>Section</span>
          <div className="flex items-center space-x-1 ml-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-primary-foreground/20"
              onClick={handleDuplicateSection}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-destructive/20"
              onClick={handleDeleteSection}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <div className={cn(getSectionWidth(), section.customWidth ? 'mx-auto' : '')}>
        {section.rows.length === 0 ? (
          <div className="min-h-[120px] flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg">
            {!isPreviewMode && (
              <Button variant="outline" onClick={handleAddRow}>
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Row drop zone at the beginning */}
            {!isPreviewMode && onAddRow && (
              <RowDropZone
                sectionId={section.id}
                insertIndex={0}
                onAddRow={onAddRow}
              />
            )}
            
            {section.rows.map((row, index) => (
              <div key={row.id}>
                <RowRenderer
                  row={row}
                  sectionId={section.id}
                  isPreviewMode={isPreviewMode}
                  deviceType={deviceType}
                  onSelectElement={onSelectElement}
                  onUpdateElement={onUpdateElement}
                  onAddElement={onAddElement}
                  onMoveElement={onMoveElement}
                  onRemoveElement={onRemoveElement}
                />
                
                {/* Row drop zone after each row */}
                {!isPreviewMode && onAddRow && (
                  <RowDropZone
                    sectionId={section.id}
                    insertIndex={index + 1}
                    onAddRow={onAddRow}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};