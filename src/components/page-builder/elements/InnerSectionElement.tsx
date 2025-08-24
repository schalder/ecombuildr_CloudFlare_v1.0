import React, { useState, useCallback } from 'react';
import { Plus, GripVertical, Copy, Trash2, Columns2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderElement, PageBuilderSection, PageBuilderRow, PageBuilderColumn } from '../types';
import { InnerRowRenderer } from '../components/InnerRowRenderer';
import { InnerElementDropZone } from '../components/InnerElementDropZone';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { renderElementStyles } from '../utils/styleRenderer';
import { generateResponsiveCSS } from '../utils/responsiveStyles';

interface InnerSectionElementProps {
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}

interface ColumnLayoutOption {
  id: string;
  name: string;
  layout: number[];
}

const COLUMN_LAYOUTS: ColumnLayoutOption[] = [
  { id: '1', name: 'Single Column', layout: [12] },
  { id: '1-1', name: 'Two Columns', layout: [6, 6] },
  { id: '1-1-1', name: 'Three Columns', layout: [4, 4, 4] },
  { id: '1-1-1-1', name: 'Four Columns', layout: [3, 3, 3, 3] },
  { id: '1-2', name: '1/3 - 2/3', layout: [4, 8] },
  { id: '2-1', name: '2/3 - 1/3', layout: [8, 4] },
];

export const InnerSectionElement: React.FC<InnerSectionElementProps> = ({
  element,
  isEditing = false,
  deviceType = 'desktop',
  onUpdate
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showLayoutModal, setShowLayoutModal] = useState(false);

  // Initialize default content if empty
  const innerRows: PageBuilderRow[] = element.content.rows || [
    {
      id: `inner-row-${Date.now()}`,
      columnLayout: '1',
      columns: [
        {
          id: `inner-col-${Date.now()}`,
          width: 12,
          elements: []
        }
      ]
    }
  ];

  const updateInnerContent = useCallback((newRows: PageBuilderRow[]) => {
    onUpdate?.({
      content: {
        ...element.content,
        rows: newRows
      }
    });
  }, [element.content, onUpdate]);

  const addRow = useCallback((layoutOption: ColumnLayoutOption) => {
    const newRow: PageBuilderRow = {
      id: `inner-row-${Date.now()}`,
      columnLayout: layoutOption.id as any,
      columns: layoutOption.layout.map((width, index) => ({
        id: `inner-col-${Date.now()}-${index}`,
        width,
        elements: []
      }))
    };

    updateInnerContent([...innerRows, newRow]);
    setShowLayoutModal(false);
  }, [innerRows, updateInnerContent]);

  const deleteRow = useCallback((rowId: string) => {
    updateInnerContent(innerRows.filter(row => row.id !== rowId));
  }, [innerRows, updateInnerContent]);

  const duplicateRow = useCallback((rowId: string) => {
    const rowIndex = innerRows.findIndex(row => row.id === rowId);
    if (rowIndex >= 0) {
      const rowToDuplicate = innerRows[rowIndex];
      const duplicatedRow: PageBuilderRow = {
        ...rowToDuplicate,
        id: `inner-row-${Date.now()}`,
        columns: rowToDuplicate.columns.map((col, colIndex) => ({
          ...col,
          id: `inner-col-${Date.now()}-${colIndex}`,
          elements: col.elements.map(el => ({
            ...el,
            id: `inner-el-${Date.now()}-${Math.random()}`
          }))
        }))
      };

      const newRows = [...innerRows];
      newRows.splice(rowIndex + 1, 0, duplicatedRow);
      updateInnerContent(newRows);
    }
  }, [innerRows, updateInnerContent]);

  const addElement = useCallback((rowId: string, columnId: string, elementType: string, insertIndex?: number) => {
    const newElement: PageBuilderElement = {
      id: `inner-el-${Date.now()}-${Math.random()}`,
      type: elementType,
      content: getDefaultContent(elementType),
      styles: {}
    };

    const newRows = innerRows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          columns: row.columns.map(col => {
            if (col.id === columnId) {
              const elements = [...col.elements];
              if (insertIndex !== undefined) {
                elements.splice(insertIndex, 0, newElement);
              } else {
                elements.push(newElement);
              }
              return { ...col, elements };
            }
            return col;
          })
        };
      }
      return row;
    });

    updateInnerContent(newRows);
  }, [innerRows, updateInnerContent]);

  const removeElement = useCallback((elementId: string) => {
    const newRows = innerRows.map(row => ({
      ...row,
      columns: row.columns.map(col => ({
        ...col,
        elements: col.elements.filter(el => el.id !== elementId)
      }))
    }));

    updateInnerContent(newRows);
  }, [innerRows, updateInnerContent]);

  const updateElement = useCallback((elementId: string, updates: Partial<PageBuilderElement>) => {
    const newRows = innerRows.map(row => ({
      ...row,
      columns: row.columns.map(col => ({
        ...col,
        elements: col.elements.map(el => 
          el.id === elementId ? { ...el, ...updates } : el
        )
      }))
    }));

    updateInnerContent(newRows);
  }, [innerRows, updateInnerContent]);

  const elementStyles = renderElementStyles(element, deviceType);

  return (
    <>
      <style>{generateResponsiveCSS(element.id, element.styles)}</style>
      <div
        className={cn(
          'inner-section-element min-h-[100px] p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg',
          isEditing && 'hover:border-primary/40',
          isHovered && isEditing && 'border-primary/40 bg-primary/5'
        )}
        style={elementStyles}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Inner Section Header */}
        {isEditing && isHovered && (
          <div className="absolute -top-8 left-0 flex items-center space-x-2 bg-primary text-primary-foreground px-3 py-1 rounded-md text-xs z-10">
            <GripVertical className="h-3 w-3" />
            <span>Inner Layout</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setShowLayoutModal(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Inner Rows */}
        <div className="space-y-4">
          {innerRows.map((row, index) => (
            <div key={row.id} className="relative">
              {/* Drop zone above row */}
              {isEditing && (
                <InnerElementDropZone
                  rowId={row.id}
                  insertIndex={index}
                  onAddRow={(layoutOption) => {
                    const newRow: PageBuilderRow = {
                      id: `inner-row-${Date.now()}`,
                      columnLayout: layoutOption.id as any,
                      columns: layoutOption.layout.map((width, colIndex) => ({
                        id: `inner-col-${Date.now()}-${colIndex}`,
                        width,
                        elements: []
                      }))
                    };
                    const newRows = [...innerRows];
                    newRows.splice(index, 0, newRow);
                    updateInnerContent(newRows);
                  }}
                />
              )}

              <InnerRowRenderer
                row={row}
                isPreviewMode={!isEditing}
                deviceType={deviceType}
                onAddElement={addElement}
                onRemoveElement={removeElement}
                onUpdateElement={updateElement}
                onDeleteRow={() => deleteRow(row.id)}
                onDuplicateRow={() => duplicateRow(row.id)}
                onAddRowAfter={() => setShowLayoutModal(true)}
              />
            </div>
          ))}

          {/* Drop zone after last row */}
          {isEditing && innerRows.length > 0 && (
            <InnerElementDropZone
              rowId={innerRows[innerRows.length - 1].id}
              insertIndex={innerRows.length}
              onAddRow={(layoutOption) => {
                addRow(layoutOption);
              }}
            />
          )}

          {/* Empty state */}
          {innerRows.length === 0 && isEditing && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No content yet</p>
              <Button onClick={() => setShowLayoutModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Row
              </Button>
            </div>
          )}
        </div>

        {/* Column Layout Selection Modal */}
        <Dialog open={showLayoutModal} onOpenChange={setShowLayoutModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Choose Column Layout</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-4">
              {COLUMN_LAYOUTS.map(layout => (
                <button
                  key={layout.id}
                  onClick={() => addRow(layout)}
                  className="p-3 border-2 border-muted rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex gap-1 mb-2">
                    {layout.layout.map((width, index) => (
                      <div
                        key={index}
                        className="bg-primary/20 rounded h-4"
                        style={{ flex: width }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{layout.name}</p>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

function getDefaultContent(elementType: string): any {
  switch (elementType) {
    case 'heading':
      return { text: 'New Heading', level: 2 };
    case 'text':
      return { text: 'Your text content goes here...' };
    case 'button':
      return { text: 'Click Me', url: '#' };
    case 'image':
      return { src: '', alt: 'Image' };
    default:
      return {};
  }
}