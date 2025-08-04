import React, { useState, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';
import { 
  Plus, 
  Settings, 
  Copy, 
  Trash2, 
  Smartphone, 
  Tablet, 
  Monitor,
  RotateCcw,
  RotateCw,
  Search,
  ChevronDown,
  ChevronRight,
  Move,
  Edit,
  Eye,
  EyeOff,
  Grip,
  Columns,
  PanelLeftOpen,
  PanelLeftClose,
  ArrowUp,
  ArrowDown,
  Type,
  Image,
  Video,
  ShoppingBag,
  Mail,
  Star,
  Grid3X3,
  Layout,
  Quote,
  MessageSquare,
  MapPin,
  Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  PageBuilderData, 
  PageBuilderElement, 
  PageBuilderSection, 
  PageBuilderRow, 
  PageBuilderColumn,
  DragItem,
  ElementType,
  COLUMN_LAYOUTS
} from './types';
import { elementRegistry } from './elements';
import { PropertiesPanel } from './components/PropertiesPanel';
import { SectionSettingsPanel, RowSettingsPanel, ColumnSettingsPanel } from './components/SettingsPanels';

interface ElementorPageBuilderProps {
  initialData?: PageBuilderData;
  onChange: (data: PageBuilderData) => void;
  onSave: () => void;
  isSaving?: boolean;
}

type SelectionType = {
  type: 'section' | 'row' | 'column' | 'element';
  id: string;
  parentId?: string;
  grandParentId?: string;
};

export const ElementorPageBuilder: React.FC<ElementorPageBuilderProps> = ({
  initialData,
  onChange,
  onSave,
  isSaving = false
}) => {
  const [data, setData] = useState<PageBuilderData>(
    initialData || { sections: [] }
  );
  const [selection, setSelection] = useState<SelectionType | null>(null);
  const [showColumnModal, setShowColumnModal] = useState<{ sectionId: string } | null>(null);
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertiesPanelCollapsed, setPropertiesPanelCollapsed] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState<{
    type: 'section' | 'row' | 'column';
    id: string;
  } | null>(null);

  const updateData = useCallback((newData: PageBuilderData) => {
    setData(newData);
    onChange(newData);
  }, [onChange]);

  const generateId = () => `pb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Initialize empty page if no data provided
  useEffect(() => {
    // Ensure element registry is initialized
    console.log('ElementorPageBuilder mounted. Available elements:', elementRegistry.getAll().map(e => ({ id: e.id, name: e.name })));
    
    if (!data || !data.sections || data.sections.length === 0) {
      const initialData: PageBuilderData = {
        sections: [{
          id: generateId(),
          rows: [{
            id: generateId(),
            columnLayout: '1',
            columns: [{
              id: generateId(),
              width: 12,
              elements: []
            }]
          }],
          width: 'wide'
        }]
      };
      updateData(initialData);
    }
  }, [data, updateData]);

  // Element operations
  const onAddElement = useCallback((sectionId: string, rowId: string, columnId: string, elementType: string) => {
    console.log('Adding element:', { sectionId, rowId, columnId, elementType });
    console.log('Available element types in registry:', elementRegistry.getAll().map(e => e.id));
    
    const elementTypeConfig = elementRegistry.get(elementType);
    if (!elementTypeConfig) {
      console.error('Element type not found in registry:', elementType);
      console.error('Available types:', elementRegistry.getAll().map(e => e.id));
      return;
    }

    const newElement: PageBuilderElement = {
      id: generateId(),
      type: elementType,
      content: { ...elementTypeConfig.defaultContent }
    };

    console.log('Creating new element:', newElement);

    const newData = {
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
    };

    updateData(newData);
    setSelection({ type: 'element', id: newElement.id, parentId: columnId, grandParentId: rowId });
  }, [data, updateData]);

  const onUpdateElement = useCallback((elementId: string, updates: Partial<PageBuilderElement>) => {
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

  const onDeleteElement = useCallback((elementId: string) => {
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
    if (selection?.id === elementId) setSelection(null);
  }, [data, updateData, selection]);

  const onDuplicateElement = useCallback((elementId: string) => {
    const element = findElement(elementId);
    if (!element) return;

    const newElement: PageBuilderElement = {
      ...element,
      id: generateId()
    };

    updateData({
      ...data,
      sections: data.sections.map(section => ({
        ...section,
        rows: (section.rows || []).map(row => ({
          ...row,
          columns: row.columns.map(col => ({
            ...col,
            elements: col.elements.flatMap(el =>
              el.id === elementId ? [el, newElement] : [el]
            )
          }))
        }))
      }))
    });
  }, [data, updateData]);

  const findElement = (elementId: string): PageBuilderElement | null => {
    for (const section of data.sections) {
      for (const row of section.rows || []) {
        for (const column of row.columns) {
          const element = column.elements.find(el => el.id === elementId);
          if (element) return element;
        }
      }
    }
    return null;
  };

  // Section operations
  const addSection = useCallback((width: PageBuilderSection['width'] = 'wide') => {
    const newSection: PageBuilderSection = {
      id: generateId(),
      width,
      rows: [{
        id: generateId(),
        columnLayout: '1',
        columns: [{
          id: generateId(),
          width: 12,
          elements: []
        }]
      }]
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
    if (selection?.id === sectionId) setSelection(null);
  }, [data, updateData, selection]);

  // Row operations
  const addRow = useCallback((sectionId: string, columnLayout: PageBuilderRow['columnLayout']) => {
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
    setShowColumnModal(null);
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
    if (selection?.id === rowId) setSelection(null);
  }, [data, updateData, selection]);

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

  // Element categories for the sidebar
  const ELEMENT_CATEGORIES = [
    {
      name: 'Basic',
      elements: [
        { id: 'heading', name: 'Heading', icon: Type, description: 'Add a title or heading' },
        { id: 'text', name: 'Text Editor', icon: Type, description: 'Rich text content' },
        { id: 'button', name: 'Button', icon: Layout, description: 'Call to action button' },
        { id: 'image', name: 'Image', icon: Image, description: 'Single image element' },
        { id: 'video', name: 'Video', icon: Video, description: 'Video player' },
        { id: 'spacer', name: 'Spacer', icon: Layout, description: 'Add space between elements' },
        { id: 'divider', name: 'Divider', icon: Layout, description: 'Visual separator line' },
        { id: 'list', name: 'List', icon: Layout, description: 'Bullet or numbered lists' }
      ]
    }
  ];

  const filteredElements = ELEMENT_CATEGORIES.map(category => ({
    ...category,
    elements: category.elements.filter(element =>
      element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.elements.length > 0);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-background">
        {/* Element Library Sidebar */}
        <div className={`border-r bg-card transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-80'}`}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && <h3 className="font-semibold">Elements</h3>}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
            </div>
            {!sidebarCollapsed && (
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search elements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}
          </div>
          
          {!sidebarCollapsed && (
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {filteredElements.map((category) => (
                  <div key={category.name}>
                    <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                      {category.name}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {category.elements.map((element) => (
                        <DraggableElement
                          key={element.id}
                          element={element}
                        />
                      ))}
                    </div>
                    <Separator className="mt-6" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

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
                onClick={() => addSection()}
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
                  <Button onClick={() => addSection()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.sections.map((section, sectionIndex) => (
                    <SectionComponent
                      key={section.id}
                      section={section}
                      sectionIndex={sectionIndex}
                      isSelected={selection?.type === 'section' && selection.id === section.id}
                      onSelect={() => setSelection({ type: 'section', id: section.id })}
                      onDelete={() => deleteSection(section.id)}
                      onOpenSettings={() => setShowSettingsPanel({ type: 'section', id: section.id })}
                      onAddRow={() => setShowColumnModal({ sectionId: section.id })}
                      onDeleteRow={(rowId) => deleteRow(section.id, rowId)}
                      onAddElement={(rowId, columnId, elementType) => 
                        onAddElement(section.id, rowId, columnId, elementType)
                      }
                      onUpdateElement={onUpdateElement}
                      onDeleteElement={onDeleteElement}
                      onDuplicateElement={onDuplicateElement}
                      selection={selection}
                      onSelectionChange={setSelection}
                      onOpenRowSettings={(rowId) => setShowSettingsPanel({ type: 'row', id: rowId })}
                      onOpenColumnSettings={(columnId) => setShowSettingsPanel({ type: 'column', id: columnId })}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className={`border-l bg-card transition-all duration-300 ${propertiesPanelCollapsed ? 'w-12' : 'w-80'}`}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              {!propertiesPanelCollapsed && (
                <h3 className="font-semibold">
                  {selection ? `${selection.type.charAt(0).toUpperCase() + selection.type.slice(1)} Properties` : 'Properties'}
                </h3>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPropertiesPanelCollapsed(!propertiesPanelCollapsed)}
              >
                {propertiesPanelCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {!propertiesPanelCollapsed && (
            <ScrollArea className="flex-1">
              {selection && selection.type === 'element' ? (
                <PropertiesPanel
                  selectedElement={findElement(selection.id)}
                  deviceType={deviceType}
                  onUpdateElement={onUpdateElement}
                />
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Select an element to edit properties</p>
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        {/* Settings Panel Overlay */}
        {showSettingsPanel && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            {showSettingsPanel.type === 'section' && (
              <SectionSettingsPanel
                section={data.sections.find(s => s.id === showSettingsPanel.id)!}
                onUpdate={(updates) => {
                  updateData({
                    ...data,
                    sections: data.sections.map(s => 
                      s.id === showSettingsPanel.id ? { ...s, ...updates } : s
                    )
                  });
                }}
                onClose={() => setShowSettingsPanel(null)}
              />
            )}
            {/* Add Row and Column settings panels here */}
          </div>
        )}
      </div>

      {/* Column Layout Modal */}
      <ColumnLayoutModal
        isOpen={!!showColumnModal}
        onClose={() => setShowColumnModal(null)}
        onSelectLayout={(layout) => {
          if (showColumnModal) {
            addRow(showColumnModal.sectionId, layout);
          }
        }}
      />
    </DndProvider>
  );
};

// Draggable Element Component
interface DraggableElementProps {
  element: {
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  };
}

const DraggableElement: React.FC<DraggableElementProps> = ({ element }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'element-type',
    item: { type: 'element-type', elementType: element.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }));

  return (
    <div
      ref={drag}
      className={`p-3 border border-border rounded-lg cursor-grab hover:border-primary/50 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex flex-col items-center space-y-2">
        <element.icon className="h-6 w-6 text-muted-foreground" />
        <span className="text-xs font-medium text-center leading-tight">
          {element.name}
        </span>
      </div>
    </div>
  );
};

// Section Component
interface SectionComponentProps {
  section: PageBuilderSection;
  sectionIndex: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onOpenSettings: () => void;
  onAddRow: () => void;
  onDeleteRow: (rowId: string) => void;
  onAddElement: (rowId: string, columnId: string, elementType: string) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateElement: (elementId: string) => void;
  selection: SelectionType | null;
  onSelectionChange: (selection: SelectionType | null) => void;
  onOpenRowSettings: (rowId: string) => void;
  onOpenColumnSettings: (columnId: string) => void;
}

const SectionComponent: React.FC<SectionComponentProps> = ({
  section,
  isSelected,
  onSelect,
  onDelete,
  onOpenSettings,
  onAddRow,
  onDeleteRow,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  selection,
  onSelectionChange,
  onOpenRowSettings,
  onOpenColumnSettings
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative group border-2 border-dashed transition-all duration-200 ${
        isSelected 
          ? 'border-primary bg-primary/5' 
          : isHovered 
            ? 'border-primary/50 bg-primary/2' 
            : 'border-transparent'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Section Toolbar */}
      {(isHovered || isSelected) && (
        <div className="absolute -top-12 left-0 z-20 flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1 rounded-md text-xs shadow-lg">
          <Grip className="h-3 w-3" />
          <span className="font-medium">Section</span>
          <Separator orientation="vertical" className="mx-1 h-4" />
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-primary-foreground/20" onClick={onAddRow}>
            <Plus className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-primary-foreground/20" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-primary-foreground/20" onClick={onOpenSettings}>
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div 
        className="w-full mx-auto p-4"
        style={{ 
          maxWidth: section.width === 'full' ? '100%' : section.width === 'wide' ? '1200px' : section.width === 'medium' ? '800px' : '600px',
          backgroundColor: section.styles?.backgroundColor 
        }}
      >
        {(!section.rows || section.rows.length === 0) ? (
          <div className="p-12 text-center border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground mb-4">This section is empty</p>
            <Button variant="outline" onClick={onAddRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {(section.rows || []).map((row) => (
              <RowComponent
                key={row.id}
                row={row}
                sectionId={section.id}
                isSelected={selection?.type === 'row' && selection.id === row.id}
                onSelect={() => onSelectionChange({ type: 'row', id: row.id, parentId: section.id })}
                onDelete={() => onDeleteRow(row.id)}
                onOpenSettings={() => onOpenRowSettings(row.id)}
                onAddElement={onAddElement}
                onUpdateElement={onUpdateElement}
                onDeleteElement={onDeleteElement}
                onDuplicateElement={onDuplicateElement}
                selection={selection}
                onSelectionChange={onSelectionChange}
                onOpenColumnSettings={onOpenColumnSettings}
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
  sectionId: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onOpenSettings: () => void;
  onAddElement: (rowId: string, columnId: string, elementType: string) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateElement: (elementId: string) => void;
  selection: SelectionType | null;
  onSelectionChange: (selection: SelectionType | null) => void;
  onOpenColumnSettings: (columnId: string) => void;
}

const RowComponent: React.FC<RowComponentProps> = ({
  row,
  sectionId,
  isSelected,
  onSelect,
  onDelete,
  onOpenSettings,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  selection,
  onSelectionChange,
  onOpenColumnSettings
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative group border border-dashed transition-all duration-200 rounded-lg ${
        isSelected 
          ? 'border-secondary bg-secondary/10' 
          : isHovered 
            ? 'border-secondary/50 bg-secondary/5' 
            : 'border-transparent'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Row Toolbar */}
      {(isHovered || isSelected) && (
        <div className="absolute -top-10 left-0 z-10 flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-xs shadow-lg">
          <Grip className="h-3 w-3" />
          <span className="font-medium">Row ({row.columnLayout})</span>
          <Separator orientation="vertical" className="mx-1 h-4" />
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-secondary-foreground/20" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-secondary-foreground/20" onClick={onOpenSettings}>
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${row.columns.length}, 1fr)` }}>
        {row.columns.map((column) => (
          <ColumnComponent
            key={column.id}
            column={column}
            rowId={row.id}
            sectionId={sectionId}
            isSelected={selection?.type === 'column' && selection.id === column.id}
            onSelect={() => onSelectionChange({ 
              type: 'column', 
              id: column.id, 
              parentId: row.id, 
              grandParentId: sectionId 
            })}
            onOpenSettings={() => onOpenColumnSettings(column.id)}
            onAddElement={(elementType) => onAddElement(row.id, column.id, elementType)}
            onUpdateElement={onUpdateElement}
            onDeleteElement={onDeleteElement}
            onDuplicateElement={onDuplicateElement}
            selection={selection}
            onSelectionChange={onSelectionChange}
          />
        ))}
      </div>
    </div>
  );
};

// Column Component
interface ColumnComponentProps {
  column: PageBuilderColumn;
  rowId: string;
  sectionId: string;
  isSelected: boolean;
  onSelect: () => void;
  onOpenSettings: () => void;
  onAddElement: (elementType: string) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateElement: (elementId: string) => void;
  selection: SelectionType | null;
  onSelectionChange: (selection: SelectionType | null) => void;
}

const ColumnComponent: React.FC<ColumnComponentProps> = ({
  column,
  rowId,
  sectionId,
  isSelected,
  onSelect,
  onOpenSettings,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  selection,
  onSelectionChange
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'element-type',
    drop: (item: DragItem) => {
      console.log('Column drop triggered:', { item, columnId: column.id, elementType: item.elementType });
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
      className={`relative min-h-24 border border-dashed rounded-lg transition-all duration-200 ${
        isOver 
          ? 'border-accent bg-accent/10' 
          : isSelected 
            ? 'border-accent bg-accent/5' 
            : isHovered 
              ? 'border-accent/50 bg-accent/2' 
              : 'border-border'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Column Toolbar */}
      {(isHovered || isSelected) && (
        <div className="absolute -top-8 left-0 z-10 flex items-center gap-1 bg-accent text-accent-foreground px-2 py-1 rounded text-xs shadow-lg">
          <Grip className="h-3 w-3" />
          <span className="font-medium">Column ({column.elements.length})</span>
          <Separator orientation="vertical" className="mx-1 h-3" />
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-accent-foreground/20" onClick={onOpenSettings}>
            <Settings className="h-2 w-2" />
          </Button>
        </div>
      )}

      <div className="p-2">
        {column.elements.length === 0 ? (
          <div className="h-20 flex flex-col items-center justify-center text-muted-foreground text-sm">
            <Plus className="h-6 w-6 mb-2 opacity-50" />
            <span>Drop elements here</span>
          </div>
        ) : (
          <div className="space-y-2">
            {column.elements.map((element) => (
              <ElementWrapper
                key={element.id}
                element={element}
                columnId={column.id}
                rowId={rowId}
                sectionId={sectionId}
                isSelected={selection?.type === 'element' && selection.id === element.id}
                onSelect={() => onSelectionChange({ 
                  type: 'element', 
                  id: element.id, 
                  parentId: column.id, 
                  grandParentId: rowId 
                })}
                onUpdate={onUpdateElement}
                onDelete={onDeleteElement}
                onDuplicate={onDuplicateElement}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Element Wrapper Component
interface ElementWrapperProps {
  element: PageBuilderElement;
  columnId: string;
  rowId: string;
  sectionId: string;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onDelete: (elementId: string) => void;
  onDuplicate: (elementId: string) => void;
}

const ElementWrapper: React.FC<ElementWrapperProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const elementDef = elementRegistry.get(element.type);

  if (!elementDef) {
    return (
      <div className="p-4 border border-destructive rounded text-destructive text-sm">
        Unknown element type: {element.type}
      </div>
    );
  }

  return (
    <div
      className={`relative group border transition-all duration-200 rounded ${
        isSelected 
          ? 'border-primary bg-primary/5' 
          : isHovered 
            ? 'border-primary/50' 
            : 'border-transparent'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Element Toolbar */}
      {(isHovered || isSelected) && (
        <div className="absolute -top-8 left-0 z-20 flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs shadow-lg">
          <elementDef.icon className="h-3 w-3" />
          <span className="font-medium">{elementDef.name}</span>
          <Separator orientation="vertical" className="mx-1 h-3" />
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0 hover:bg-primary-foreground/20"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(element.id);
            }}
          >
            <Copy className="h-2 w-2" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground" 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(element.id);
            }}
          >
            <Trash2 className="h-2 w-2" />
          </Button>
        </div>
      )}

      <elementDef.component
        element={element}
        isEditing={true}
        onUpdate={(updates) => onUpdate(element.id, updates)}
      />
    </div>
  );
};

// Column Layout Modal
interface ColumnLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLayout: (layout: PageBuilderRow['columnLayout']) => void;
}

const ColumnLayoutModal: React.FC<ColumnLayoutModalProps> = ({
  isOpen,
  onClose,
  onSelectLayout
}) => {
  const layouts = [
    { id: '1', name: 'Single Column', preview: '━━━━━━━━━━━━' },
    { id: '1-1', name: 'Two Columns (50/50)', preview: '━━━━━ ━━━━━' },
    { id: '1-2', name: 'Two Columns (33/67)', preview: '━━━ ━━━━━━━━' },
    { id: '2-1', name: 'Two Columns (67/33)', preview: '━━━━━━━━ ━━━' },
    { id: '1-1-1', name: 'Three Columns', preview: '━━━ ━━━ ━━━' },
    { id: '1-2-1', name: 'Three Columns (25/50/25)', preview: '━━ ━━━━ ━━' },
    { id: '2-1-1', name: 'Three Columns (50/25/25)', preview: '━━━━ ━━ ━━' },
    { id: '1-1-1-1', name: 'Four Columns', preview: '━━ ━━ ━━ ━━' },
  ] as const;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose Column Layout</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {layouts.map((layout) => (
            <Button
              key={layout.id}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 hover:border-primary"
              onClick={() => onSelectLayout(layout.id)}
            >
              <div className="font-mono text-lg">{layout.preview}</div>
              <span className="text-sm">{layout.name}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};