import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Trash2, Copy, Settings, GripVertical, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderSection, PageBuilderElement } from '../types';
import { RowRenderer } from './RowRenderer';
import { DividerRenderer } from '../dividers/DividerRenderer';
import { cn } from '@/lib/utils';
import { renderSectionStyles, hasUserBackground, hasUserShadow } from '../utils/styleRenderer';
import { isElementVisible, getVisibilityStyles } from '../utils/deviceDetection';

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

  // Check section visibility
  const isVisible = isElementVisible(section.visibility, deviceType);
  const visibilityStyles = getVisibilityStyles(section.visibility, deviceType);

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
          return 'max-w-3xl mx-auto px-4';
        case 'medium':
          return 'max-w-lg mx-auto px-4';
        case 'small':
          return 'max-w-sm mx-auto px-4';
        default:
          return 'max-w-3xl mx-auto px-4';
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
    const baseStyles = renderSectionStyles(section, deviceType, !isPreviewMode);
    
    // Add flex styles for vertical alignment - device aware
    const verticalAlignment = section.styles?.responsive?.[deviceType]?.contentVerticalAlignment || 
                             section.styles?.contentVerticalAlignment;
    
    // Apply vertical alignment if section has height or minHeight
    const hasHeight = baseStyles.height && baseStyles.height !== 'auto';
    const hasMinHeight = baseStyles.minHeight && baseStyles.minHeight !== 'auto';
    
    if (verticalAlignment && (hasHeight || hasMinHeight)) {
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

  // Don't render section if it's not visible on current device
  if (!isVisible && isPreviewMode) {
    return null;
  }

  return (
    <div
      ref={drop}
      id={section.anchor}
      data-pb-section-id={section.id}
      className={cn(
        'relative group transition-all duration-200',
        // Only apply border styles if not in preview mode and no user background
        !isPreviewMode && !(userBackground || userShadow) && 'border-2 border-dashed',
        !isPreviewMode && !(userBackground || userShadow) && isSelected && 'border-primary',
        !isPreviewMode && !(userBackground || userShadow) && isSelected && 'bg-primary/5',
        !isPreviewMode && !(userBackground || userShadow) && isHovered && !isSelected && 'border-primary/30',
        !isPreviewMode && !(userBackground || userShadow) && isHovered && !isSelected && 'bg-primary/2',
        !isPreviewMode && !(userBackground || userShadow) && !isHovered && !isSelected && 'border-transparent',
        !isPreviewMode && !(userBackground || userShadow) && isOver && 'bg-primary/5',
        // Apply visibility styles in preview mode
        isPreviewMode && !isVisible && 'hidden'
      )}
      style={{
        ...getSectionStyles(),
        // Apply visibility styles in preview mode
        ...(isPreviewMode ? visibilityStyles : {})
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleSectionClick}
    >
      {/* Overlay border for sections with background */}
      {!isPreviewMode && (userBackground || userShadow) && (isSelected || isHovered) && (
        <div 
          className={cn(
            'absolute inset-0 pointer-events-none z-20 border-2 border-dashed',
            isSelected ? 'border-primary' : 'border-primary/30'
          )}
        />
      )}

      {/* Section Controls */}
      {!isPreviewMode && (isSelected || isHovered) && (
        <div className="absolute -top-10 left-0 flex items-center space-x-1 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs z-10">
          <GripVertical className="h-3 w-3" />
          <span>Section</span>
          {/* Visibility indicator */}
          {!isVisible && (
            <div className="flex items-center space-x-1 ml-1 px-1 py-0.5 bg-orange-500 text-white rounded text-xs">
              <EyeOff className="h-3 w-3" />
              <span className="capitalize">{deviceType}</span>
            </div>
          )}
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

      {/* Top Divider */}
      {section.styles?.topDivider?.enabled && (
        <DividerRenderer divider={section.styles.topDivider} position="top" />
      )}

      {/* Bottom Divider */}
      {/* Visual indicator for hidden sections in editor mode */}
      {!isPreviewMode && !isVisible && (
        <div className="absolute inset-0 bg-gray-200/50 border-2 border-dashed border-gray-400 rounded flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-white px-3 py-1 rounded-md shadow-sm flex items-center space-x-2 text-sm text-gray-600">
            <EyeOff className="h-4 w-4" />
            <span>Section hidden on {deviceType}</span>
          </div>
        </div>
      )}

      {section.styles?.bottomDivider?.enabled && (
        <DividerRenderer divider={section.styles.bottomDivider} position="bottom" />
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
          <div className="relative min-h-[120px] flex items-center justify-center border-2 border-dashed border-muted-foreground/30 group">
            {!isPreviewMode && (
              <>
                <div className="text-muted-foreground text-sm">Empty section</div>
                {/* Add first row button - appears on hover at bottom border */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddRow();
                    }}
                    className="h-8 w-8 p-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg border-2 border-background"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-0">
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
                onAddRowAfter={() => onAddRowAfter(rowIndex + 1)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};