import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Trash2, Copy, Settings, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderSection, PageBuilderElement } from '../types';
import { RowRenderer } from './RowRenderer';
import { cn } from '@/lib/utils';
import { renderSectionStyles, hasUserBackground, hasUserShadow } from '../utils/styleRenderer';

interface SectionRendererProps {
  section: PageBuilderSection;
  sectionIndex: number;
  isSelected: boolean;
  isPreviewMode: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onSelectElement: (element: PageBuilderElement | undefined) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onAddElement: (sectionId: string, rowId: string, columnId: string, elementType: string, insertIndex?: number) => void;
  onMoveElement?: (elementId: string, sectionId: string, rowId: string, columnId: string, insertIndex: number) => void;
  onRemoveElement: (elementId: string) => void;
  onAddSectionAfter: () => void;
  onAddRowAfter: (rowIndex: number) => void;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  sectionIndex,
  isSelected,
  isPreviewMode,
  deviceType = 'desktop',
  onSelectElement,
  onUpdateElement,
  onAddElement,
  onMoveElement,
  onRemoveElement,
  onAddSectionAfter,
  onAddRowAfter
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [{ isOver }, drop] = isPreviewMode 
    ? [{ isOver: false }, React.useRef(null)]
    : useDrop({
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
    onAddRowAfter(section.rows.length);
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

  const getSectionStyles = (): React.CSSProperties => {
    const baseStyles = renderSectionStyles(section, deviceType);
    
    // Add flex styles for vertical alignment - device aware
    const verticalAlignment = section.styles?.responsive?.[deviceType]?.contentVerticalAlignment || 
                             section.styles?.contentVerticalAlignment;
    
    if (verticalAlignment && baseStyles.height && baseStyles.height !== 'auto') {
      return {
        ...baseStyles,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: verticalAlignment === 'center' ? 'center' : 
                       verticalAlignment === 'bottom' ? 'flex-end' : 'flex-start'
      };
    }
    
    return baseStyles;
  };

  const userBackground = hasUserBackground(section.styles);
  const userShadow = hasUserShadow(section.styles);

  return (
    <div
      ref={drop}
      id={section.anchor}
      data-pb-section-id={section.id}
      className={cn(
        'relative group transition-all duration-200',
        // Only apply border styles if not in preview mode
        !isPreviewMode && 'border-2 border-dashed',
        !isPreviewMode && isSelected && 'border-primary',
        !isPreviewMode && isSelected && !userBackground && 'bg-primary/5',
        !isPreviewMode && isHovered && !isSelected && 'border-primary/30',
        !isPreviewMode && isHovered && !isSelected && !userBackground && 'bg-primary/2',
        !isPreviewMode && !isHovered && !isSelected && 'border-transparent',
        !isPreviewMode && isOver && !userBackground && 'bg-primary/5'
      )}
      style={getSectionStyles()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleSectionClick}
    >
      {/* Section Controls */}
      {!isPreviewMode && (isSelected || isHovered) && (
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
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-primary-foreground/20"
              onClick={(e) => {
                e.stopPropagation();
                onAddSectionAfter();
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <div 
        className={cn(
          getSectionWidth(), 
          section.customWidth ? 'mx-auto' : '',
          'flex flex-col',
          section.styles?.contentVerticalAlignment === 'center' && 'justify-center',
          section.styles?.contentVerticalAlignment === 'bottom' && 'justify-end',
          (!section.styles?.contentVerticalAlignment || section.styles?.contentVerticalAlignment === 'top') && 'justify-start'
        )}
        style={{ minHeight: 'inherit' }}
      >
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
            {section.rows.map((row, rowIndex) => (
              <RowRenderer
                key={row.id}
                row={row}
                rowIndex={rowIndex}
                sectionId={section.id}
                isPreviewMode={isPreviewMode}
                deviceType={deviceType}
                onSelectElement={onSelectElement}
                onUpdateElement={onUpdateElement}
                onAddElement={onAddElement}
                onMoveElement={onMoveElement}
                onRemoveElement={onRemoveElement}
                onAddRowAfter={() => onAddRowAfter(rowIndex)}
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