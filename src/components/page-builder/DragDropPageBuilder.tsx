import React, { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Grip, Trash2, Edit, Copy, Smartphone, Tablet, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  PageBuilderData, 
  PageBuilderSection, 
  PageBuilderRow, 
  PageBuilderColumn, 
  PageBuilderElement,
  ElementType,
  DragItem,
  COLUMN_LAYOUTS,
  SECTION_WIDTHS 
} from './types';
import { elementRegistry } from './elements';

interface DragDropPageBuilderProps {
  initialData?: PageBuilderData;
  onChange: (data: PageBuilderData) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export const DragDropPageBuilder: React.FC<DragDropPageBuilderProps> = ({
  initialData,
  onChange,
  onSave,
  isSaving = false
}) => {
  const [data, setData] = useState<PageBuilderData>(
    initialData || { sections: [] }
  );
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<{ type: 'section' | 'row' | 'element'; targetId?: string } | null>(null);
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const updateData = useCallback((newData: PageBuilderData) => {
    setData(newData);
    onChange(newData);
  }, [onChange]);

  const generateId = () => `pb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Section operations
  const addSection = useCallback((width: PageBuilderSection['width'] = 'wide') => {
    const newSection: PageBuilderSection = {
      id: generateId(),
      width,
      rows: []
    };
    
    updateData({
      ...data,
      sections: [...data.sections, newSection]
    });
  }, [data, updateData]);

  const deleteSection = useCallback((sectionId: string) => {
    updateData({
      ...data,
      sections: data.sections.filter(s => s.id !== sectionId)
    });
  }, [data, updateData]);

  const duplicateSection = useCallback((sectionId: string) => {
    const section = data.sections.find(s => s.id === sectionId);
    if (!section) return;

    const duplicatedSection: PageBuilderSection = {
      ...section,
      id: generateId(),
      rows: (section.rows || []).map(row => ({
        ...row,
        id: generateId(),
        columns: row.columns.map(col => ({
          ...col,
          id: generateId(),
          elements: col.elements.map(el => ({
            ...el,
            id: generateId()
          }))
        }))
      }))
    };

    const sectionIndex = data.sections.findIndex(s => s.id === sectionId);
    const newSections = [...data.sections];
    newSections.splice(sectionIndex + 1, 0, duplicatedSection);

    updateData({
      ...data,
      sections: newSections
    });
  }, [data, updateData]);

  // Row operations
  const addRow = useCallback((sectionId: string, columnLayout: PageBuilderRow['columnLayout'] = '1') => {
    const columnWidths = COLUMN_LAYOUTS[columnLayout];
    const newRow: PageBuilderRow = {
      id: generateId(),
      columnLayout,
      columns: columnWidths.map(width => ({
        id: generateId(),
        width,
        elements: []
      }))
    };

    updateData({
      ...data,
      sections: data.sections.map(section =>
        section.id === sectionId
          ? { ...section, rows: [...(section.rows || []), newRow] }
          : section
      )
    });
  }, [data, updateData]);

  const deleteRow = useCallback((sectionId: string, rowId: string) => {
    updateData({
      ...data,
      sections: data.sections.map(section =>
        section.id === sectionId
          ? { ...section, rows: (section.rows || []).filter(row => row.id !== rowId) }
          : section
      )
    });
  }, [data, updateData]);

  // Element operations
  const addElement = useCallback((sectionId: string, rowId: string, columnId: string, elementType: string) => {
    const elementDef = elementRegistry.get(elementType);
    if (!elementDef) return;

    const newElement: PageBuilderElement = {
      id: generateId(),
      type: elementType,
      content: { ...elementDef.defaultContent }
    };

    updateData({
      ...data,
      sections: data.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              rows: (section.rows || []).map(row =>
                row.id === rowId
                  ? {
                      ...row,
                      columns: row.columns.map(col =>
                        col.id === columnId
                          ? { ...col, elements: [...col.elements, newElement] }
                          : col
                      )
                    }
                  : row
              )
            }
          : section
      )
    });
  }, [data, updateData]);

  const updateElement = useCallback((elementId: string, updates: Partial<PageBuilderElement>) => {
    updateData({
      ...data,
      sections: data.sections.map(section => ({
        ...section,
        rows: (section.rows || []).map(row => ({
          ...row,
          columns: row.columns.map(col => ({
            ...col,
            elements: col.elements.map(el =>
              el.id === elementId ? { ...el, ...updates } : el
            )
          }))
        }))
      }))
    });
  }, [data, updateData]);

  const deleteElement = useCallback((elementId: string) => {
    updateData({
      ...data,
      sections: data.sections.map(section => ({
        ...section,
        rows: (section.rows || []).map(row => ({
          ...row,
          columns: row.columns.map(col => ({
            ...col,
            elements: col.elements.filter(el => el.id !== elementId)
          }))
        }))
      }))
    });
  }, [data, updateData]);

  const getDevicePreviewStyles = () => {
    switch (deviceType) {
      case 'tablet':
        return { maxWidth: '768px', margin: '0 auto' };
      case 'mobile':
        return { maxWidth: '375px', margin: '0 auto' };
      default:
        return {};
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-background">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Toolbar */}
          <div className="border-b bg-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">Page Builder</h2>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <Button
                  variant={deviceType === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDeviceType('desktop')}
                  className="h-8"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={deviceType === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDeviceType('tablet')}
                  className="h-8"
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={deviceType === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDeviceType('mobile')}
                  className="h-8"
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAddModal({ type: 'section' })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
              <Button onClick={onSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-auto bg-muted/30 p-8">
            <div style={getDevicePreviewStyles()} className="min-h-full bg-background rounded-lg shadow-sm">
              {data.sections.length === 0 ? (
                <div className="p-16 text-center">
                  <h3 className="text-lg font-medium mb-2">Start Building Your Page</h3>
                  <p className="text-muted-foreground mb-4">Add your first section to get started</p>
                  <Button onClick={() => setShowAddModal({ type: 'section' })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.sections.map((section, sectionIndex) => (
                    <SectionComponent
                      key={section.id}
                      section={section}
                      sectionIndex={sectionIndex}
                      onDelete={() => deleteSection(section.id)}
                      onDuplicate={() => duplicateSection(section.id)}
                      onAddRow={(layout) => addRow(section.id, layout)}
                      onDeleteRow={(rowId) => deleteRow(section.id, rowId)}
                      onAddElement={(rowId, columnId, elementType) => 
                        addElement(section.id, rowId, columnId, elementType)
                      }
                      onUpdateElement={updateElement}
                      onDeleteElement={deleteElement}
                      selectedElement={selectedElement}
                      onSelectElement={setSelectedElement}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AddModal
        isOpen={!!showAddModal}
        onClose={() => setShowAddModal(null)}
        type={showAddModal?.type || 'section'}
        onAddSection={addSection}
        onAddRow={(layout) => addRow(showAddModal?.targetId || '', layout)}
        onAddElement={(elementType) => {
          // This would be called from column context
        }}
      />
    </DndProvider>
  );
};

// Section Component with drag/drop
interface SectionComponentProps {
  section: PageBuilderSection;
  sectionIndex: number;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddRow: (layout: PageBuilderRow['columnLayout']) => void;
  onDeleteRow: (rowId: string) => void;
  onAddElement: (rowId: string, columnId: string, elementType: string) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onDeleteElement: (elementId: string) => void;
  selectedElement: string | null;
  onSelectElement: (elementId: string | null) => void;
}

const SectionComponent: React.FC<SectionComponentProps> = ({
  section,
  onDelete,
  onDuplicate,
  onAddRow,
  onDeleteRow,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  selectedElement,
  onSelectElement
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative group border border-dashed border-transparent hover:border-primary/50 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Section Toolbar */}
      {isHovered && (
        <div className="absolute -top-10 left-0 z-10 flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
          <Grip className="h-3 w-3" />
          <span>Section</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDuplicate}>
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div 
        className="w-full mx-auto"
        style={{ 
          maxWidth: SECTION_WIDTHS[section.width],
          backgroundColor: section.styles?.backgroundColor 
        }}
      >
        {(!section.rows || section.rows.length === 0) ? (
          <div className="p-8 text-center border border-dashed border-border rounded">
            <p className="text-muted-foreground mb-4">This section is empty</p>
            <Button variant="outline" onClick={() => onAddRow('1')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {(section.rows || []).map((row) => (
              <RowComponent
                key={row.id}
                row={row}
                onDelete={() => onDeleteRow(row.id)}
                onAddElement={(columnId, elementType) => onAddElement(row.id, columnId, elementType)}
                onUpdateElement={onUpdateElement}
                onDeleteElement={onDeleteElement}
                selectedElement={selectedElement}
                onSelectElement={onSelectElement}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Row Component
interface RowComponentProps {
  row: PageBuilderRow;
  onDelete: () => void;
  onAddElement: (columnId: string, elementType: string) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onDeleteElement: (elementId: string) => void;
  selectedElement: string | null;
  onSelectElement: (elementId: string | null) => void;
}

const RowComponent: React.FC<RowComponentProps> = ({
  row,
  onDelete,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  selectedElement,
  onSelectElement
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Row Toolbar */}
      {isHovered && (
        <div className="absolute -top-8 left-0 z-10 flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs">
          <Grip className="h-3 w-3" />
          <span>Row ({row.columnLayout})</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${row.columns.length}, 1fr)` }}>
        {row.columns.map((column) => (
          <ColumnComponent
            key={column.id}
            column={column}
            onAddElement={(elementType) => onAddElement(column.id, elementType)}
            onUpdateElement={onUpdateElement}
            onDeleteElement={onDeleteElement}
            selectedElement={selectedElement}
            onSelectElement={onSelectElement}
          />
        ))}
      </div>
    </div>
  );
};

// Column Component
interface ColumnComponentProps {
  column: PageBuilderColumn;
  onAddElement: (elementType: string) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onDeleteElement: (elementId: string) => void;
  selectedElement: string | null;
  onSelectElement: (elementId: string | null) => void;
}

const ColumnComponent: React.FC<ColumnComponentProps> = ({
  column,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  selectedElement,
  onSelectElement
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'element-type',
    drop: (item: DragItem) => {
      if (item.elementType) {
        onAddElement(item.elementType);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }));

  return (
    <div 
      ref={drop}
      className={`min-h-20 border border-dashed border-border rounded p-2 transition-colors ${
        isOver ? 'border-primary bg-primary/5' : ''
      }`}
    >
      {column.elements.length === 0 ? (
        <div className="h-16 flex items-center justify-center text-muted-foreground text-sm">
          Drop elements here
        </div>
      ) : (
        <div className="space-y-2">
          {column.elements.map((element) => (
            <ElementWrapper
              key={element.id}
              element={element}
              isSelected={selectedElement === element.id}
              onSelect={() => onSelectElement(element.id)}
              onUpdate={(updates) => onUpdateElement(element.id, updates)}
              onDelete={() => onDeleteElement(element.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Element Wrapper Component
interface ElementWrapperProps {
  element: PageBuilderElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<PageBuilderElement>) => void;
  onDelete: () => void;
}

const ElementWrapper: React.FC<ElementWrapperProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}) => {
  const elementDef = elementRegistry.get(element.type);
  
  if (!elementDef) {
    return <div className="p-2 bg-destructive/10 text-destructive text-sm">Unknown element: {element.type}</div>;
  }

  const ElementComponent = elementDef.component;

  return (
    <div 
      className={`relative group cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-border'
      }`}
      onClick={onSelect}
    >
      {isSelected && (
        <div className="absolute -top-8 left-0 z-10 flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
          <Edit className="h-3 w-3" />
          <span>{elementDef.name}</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      <ElementComponent 
        element={element} 
        isEditing={isSelected}
        onUpdate={onUpdate}
      />
    </div>
  );
};

// Add Modal Component
interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'section' | 'row' | 'element';
  onAddSection: (width: PageBuilderSection['width']) => void;
  onAddRow: (layout: PageBuilderRow['columnLayout']) => void;
  onAddElement: (elementType: string) => void;
}

const AddModal: React.FC<AddModalProps> = ({
  isOpen,
  onClose,
  type,
  onAddSection,
  onAddRow,
  onAddElement
}) => {
  const elements = elementRegistry.getAll();
  const elementsByCategory = elements.reduce((acc, element) => {
    if (!acc[element.category]) acc[element.category] = [];
    acc[element.category].push(element);
    return acc;
  }, {} as Record<string, ElementType[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            Add {type === 'section' ? 'Section' : type === 'row' ? 'Row' : 'Element'}
          </DialogTitle>
        </DialogHeader>

        {type === 'section' && (
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(SECTION_WIDTHS).map(([key, width]) => (
              <Button
                key={key}
                variant="outline"
                className="h-20 flex-col"
                onClick={() => {
                  onAddSection(key as PageBuilderSection['width']);
                  onClose();
                }}
              >
                <div className="font-medium capitalize">{key}</div>
                <div className="text-xs text-muted-foreground">{width}</div>
              </Button>
            ))}
          </div>
        )}

        {type === 'row' && (
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(COLUMN_LAYOUTS).map(([layout, widths]) => (
              <Button
                key={layout}
                variant="outline"
                className="h-16 flex-col"
                onClick={() => {
                  onAddRow(layout as PageBuilderRow['columnLayout']);
                  onClose();
                }}
              >
                <div className="flex gap-1 mb-1">
                  {widths.map((width, i) => (
                    <div 
                      key={i} 
                      className="bg-primary/20 rounded"
                      style={{ width: `${width * 2}px`, height: '8px' }}
                    />
                  ))}
                </div>
                <div className="text-xs">{layout}</div>
              </Button>
            ))}
          </div>
        )}

        {type === 'element' && (
          <Tabs defaultValue={Object.keys(elementsByCategory)[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              {Object.keys(elementsByCategory).map(category => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {Object.entries(elementsByCategory).map(([category, categoryElements]) => (
              <TabsContent key={category} value={category} className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {categoryElements.map(element => (
                    <DraggableElement
                      key={element.id}
                      element={element}
                      onClick={() => {
                        onAddElement(element.id);
                        onClose();
                      }}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Draggable Element Component
interface DraggableElementProps {
  element: ElementType;
  onClick: () => void;
}

const DraggableElement: React.FC<DraggableElementProps> = ({ element, onClick }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'element-type',
    item: { type: 'element-type', elementType: element.id } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }));

  const IconComponent = element.icon;

  return (
    <div
      ref={drag}
      className={`p-4 border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <IconComponent className="h-6 w-6 text-primary" />
        <div>
          <div className="font-medium">{element.name}</div>
          {element.description && (
            <div className="text-xs text-muted-foreground">{element.description}</div>
          )}
        </div>
      </div>
    </div>
  );
};