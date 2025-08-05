import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Trash2, Copy, Settings, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderSection, PageBuilderElement } from '../types';
import { RowRenderer } from './RowRenderer';
import { cn } from '@/lib/utils';

interface SectionRendererProps {
  section: PageBuilderSection;
  isSelected: boolean;
  isPreviewMode: boolean;
  onSelectElement: (element: PageBuilderElement | undefined) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onAddElement: (sectionId: string, rowId: string, columnId: string, elementType: string, insertIndex?: number) => void;
  onMoveElement?: (elementId: string, sectionId: string, rowId: string, columnId: string, insertIndex: number) => void;
  onRemoveElement: (elementId: string) => void;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  isSelected,
  isPreviewMode,
  onSelectElement,
  onUpdateElement,
  onAddElement,
  onMoveElement,
  onRemoveElement
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

  return (
    <div
      ref={drop}
      className={cn(
        'relative group',
        isSelected && !isPreviewMode && 'ring-2 ring-primary ring-opacity-50',
        isOver && 'bg-primary/5',
        section.styles?.backgroundColor && `bg-[${section.styles.backgroundColor}]`,
        section.styles?.padding || 'py-12'
      )}
      style={{
        backgroundImage: section.styles?.backgroundImage 
          ? `url(${section.styles.backgroundImage})` 
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
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

      <div className={getSectionWidth()}>
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
          <div className="space-y-4">
            {section.rows.map((row) => (
              <RowRenderer
                key={row.id}
                row={row}
                sectionId={section.id}
                isPreviewMode={isPreviewMode}
                onSelectElement={onSelectElement}
                onUpdateElement={onUpdateElement}
                onAddElement={onAddElement}
                onMoveElement={onMoveElement}
                onRemoveElement={onRemoveElement}
              />
            ))}
            
            {!isPreviewMode && (
              <div className="pt-4 text-center">
                <Button variant="outline" size="sm" onClick={handleAddRow}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};