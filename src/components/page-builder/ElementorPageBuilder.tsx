// Page builder with floating elements panel
import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Plus, 
  Grip, 
  Trash2, 
  Edit, 
  Copy, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
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
  Code,
  ArrowUp,
  ArrowDown,
  Move,
  Columns,
  PanelLeftOpen,
  PanelLeftClose
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PropertiesPanel } from './components/PropertiesPanel';
import { SettingsPanel } from './components/SettingsPanels';
import { ElementDropZone } from './components/ElementDropZone';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { SectionRenderer } from './components/SectionRenderer';
import { 
  PageBuilderData, 
  PageBuilderSection, 
  PageBuilderRow, 
  PageBuilderColumn, 
  PageBuilderElement,
  ElementType,
  DragItem,
  COLUMN_LAYOUTS,
  RESPONSIVE_LAYOUTS,
  SECTION_WIDTHS 
} from './types';
import { elementRegistry } from './elements';
import { renderSectionStyles, renderRowStyles, renderColumnStyles, hasUserBackground, hasUserShadow } from './utils/styleRenderer';
import { SectionDropZone } from './components/SectionDropZone';
import { RowDropZone } from './components/RowDropZone';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ensureAnchors, buildAnchor } from './utils/anchor';
import { HoverProvider, useHover, HoverTarget } from './contexts/HoverContext';
import { useDragAutoscroll } from '@/hooks/useDragAutoscroll';

// Helper function to get responsive grid classes for a row
const getResponsiveGridClasses = (columnLayout: string, deviceType: 'desktop' | 'tablet' | 'mobile'): string => {
  // Force single column on mobile for all layouts
  if (deviceType === 'mobile') {
    return 'grid-cols-1';
  }
  
  // For tablet, use simplified layouts
  if (deviceType === 'tablet') {
    const columnCount = COLUMN_LAYOUTS[columnLayout]?.length || 1;
    if (columnCount === 1) {
      return 'grid-cols-1'; // Single column stays single on tablet
    }
    if (columnCount >= 3) {
      return 'grid-cols-2'; // Max 2 columns on tablet for 3+ column layouts
    }
    return 'grid-cols-2'; // 2 columns on tablet for 2-column layouts
  }
  
  // For desktop, use full responsive layout
  return RESPONSIVE_LAYOUTS[columnLayout] || 'grid-cols-1';
};

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
      { id: 'divider', name: 'Divider', icon: Layout, description: 'Visual separator line' }
    ]
  },
  {
    name: 'eCommerce',
    elements: [
      { id: 'products-page', name: 'Products Page', icon: Grid3X3, description: 'Full products listing page' },
      { id: 'product-grid', name: 'Product Grid', icon: Grid3X3, description: 'Display products in grid' },
      { id: 'featured-products', name: 'Featured Products', icon: Star, description: 'Highlight featured products' },
      { id: 'product-categories', name: 'Product Categories', icon: ShoppingBag, description: 'Show product categories' },
      { id: 'add-to-cart', name: 'Add to Cart', icon: ShoppingBag, description: 'Add to cart button' },
      { id: 'price', name: 'Price', icon: ShoppingBag, description: 'Product price display' }
    ]
  },
  {
    name: 'Forms',
    elements: [
      { id: 'contact-form', name: 'Contact Form', icon: Mail, description: 'Contact form with fields' },
      { id: 'newsletter', name: 'Newsletter', icon: Mail, description: 'Email subscription form' },
      { id: 'form-field', name: 'Form Field', icon: Layout, description: 'Single form input field' }
    ]
  },
  {
    name: 'Content',
    elements: [
      { id: 'testimonial', name: 'Testimonial', icon: Quote, description: 'Customer testimonial' },
      { id: 'faq', name: 'FAQ', icon: MessageSquare, description: 'Frequently asked questions' },
      { id: 'accordion', name: 'Accordion', icon: Layout, description: 'Collapsible content sections' },
      { id: 'tabs', name: 'Tabs', icon: Layout, description: 'Tabbed content area' }
    ]
  },
  {
    name: 'Media',
    elements: [
      { id: 'image-gallery', name: 'Image Gallery', icon: Image, description: 'Multiple images in gallery' },
      { id: 'image-carousel', name: 'Image Carousel', icon: Image, description: 'Sliding image carousel' },
      { id: 'video-playlist', name: 'Video Playlist', icon: Video, description: 'Multiple videos' }
    ]
  },
  {
    name: 'Advanced',
    elements: [
      { id: 'google-maps', name: 'Google Maps', icon: MapPin, description: 'Interactive map' },
      { id: 'custom-html', name: 'HTML', icon: Code, description: 'Custom HTML code' },
      { id: 'social-share', name: 'Social Share', icon: Layout, description: 'Social media sharing buttons' }
    ]
  }
];

export const ElementorPageBuilder: React.FC<ElementorPageBuilderProps> = memo(({
  initialData,
  onChange,
  onSave,
  isSaving = false
}) => {
  return (
    <HoverProvider>
      <ElementorPageBuilderContent
        initialData={initialData}
        onChange={onChange}
        onSave={onSave}
        isSaving={isSaving}
      />
    </HoverProvider>
  );
});

const ElementorPageBuilderContent: React.FC<ElementorPageBuilderProps> = memo(({
  initialData,
  onChange,
  onSave,
  isSaving = false
}) => {
  const [data, setData] = useState<PageBuilderData>(
    () => ensureAnchors(initialData || { sections: [] })
  );
  const [selection, setSelection] = useState<SelectionType | null>(null);
  const [showColumnModal, setShowColumnModal] = useState<{ sectionId: string; insertIndex?: number } | null>(null);
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isElementsPanelOpen, setIsElementsPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertiesPanelCollapsed, setPropertiesPanelCollapsed] = useState(false);
  const [deleteColumnDialog, setDeleteColumnDialog] = useState<{
    sectionId: string;
    rowId: string;
    columnId: string;
  } | null>(null);
  
  const elementsPanelRef = useRef<HTMLDivElement>(null);

  // Ensure legacy long anchors are converted after hot reloads too
  React.useEffect(() => {
    setData(prev => ensureAnchors(prev));
  }, []);

  // When initialData loads/changes asynchronously, normalize anchors
  React.useEffect(() => {
    if (initialData) {
      setData(ensureAnchors(initialData));
    }
  }, [initialData]);

  // Handle click outside elements panel to auto-close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isElementsPanelOpen &&
        elementsPanelRef.current &&
        !elementsPanelRef.current.contains(event.target as Node)
      ) {
        const target = event.target as Element;
        // Don't close if clicking on elements panel toggle button
        if (!target.closest('[data-elements-panel-toggle]')) {
          setIsElementsPanelOpen(false);
        }
      }
    };

    if (isElementsPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isElementsPanelOpen]);


  const updateData = useCallback((newData: PageBuilderData) => {
    const ensured = ensureAnchors(newData);
    setData(ensured);
    onChange(ensured);
  }, [onChange]);

  const generateId = () => `pb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;


  // Section operations
  const addSection = useCallback((width: PageBuilderSection['width'] = 'wide', insertIndex?: number) => {
    const newSection: PageBuilderSection = {
      id: generateId(),
      anchor: buildAnchor('section'),
      width,
      rows: [],
      styles: {
        paddingTop: '20px',
        paddingBottom: '20px'
      }
    };
    
    const newSections = [...data.sections];
    if (typeof insertIndex === 'number') {
      newSections.splice(insertIndex, 0, newSection);
    } else {
      newSections.push(newSection);
    }
    
    updateData({
      ...data,
      sections: newSections
    });
  }, [data, updateData]);

  const addSectionAfter = useCallback((sectionIndex: number) => {
    addSection('wide', sectionIndex + 1);
  }, [addSection]);

  const addRowAfter = useCallback((sectionId: string, rowIndex: number) => {
    setShowColumnModal({ sectionId, insertIndex: rowIndex + 1 });
  }, []);

  const deleteSection = useCallback((sectionId: string) => {
    updateData({
      ...data,
      sections: data.sections.filter(s => s.id !== sectionId)
    });
    if (selection?.id === sectionId) setSelection(null);
  }, [data, updateData, selection]);

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

  const duplicateElement = useCallback((elementId: string) => {
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

  // Row operations
  const addRow = useCallback((sectionId: string, columnLayout: PageBuilderRow['columnLayout'], insertIndex?: number) => {
    const columnWidths = COLUMN_LAYOUTS[columnLayout];
    const newRow: PageBuilderRow = {
      id: generateId(),
      anchor: buildAnchor('row'),
      columnLayout,
      styles: {
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '5px',
        paddingRight: '5px'
      },
      columns: columnWidths.map(width => ({
        id: generateId(),
        anchor: buildAnchor('col'),
        width,
        elements: [],
        styles: {
          paddingTop: '10px',
          paddingRight: '5px',
          paddingLeft: '5px',
          paddingBottom: '10px'
        }
      }))
    };

    updateData({
      ...data,
      sections: data.sections.map(section =>
        section.id === sectionId
          ? { 
              ...section, 
              rows: typeof insertIndex === 'number' 
                ? [
                    ...(section.rows || []).slice(0, insertIndex),
                    newRow,
                    ...(section.rows || []).slice(insertIndex)
                  ]
                : [...(section.rows || []), newRow]
            }
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

  const duplicateRow = useCallback((sectionId: string, rowId: string) => {
    const section = data.sections.find(s => s.id === sectionId);
    const row = section?.rows?.find(r => r.id === rowId);
    if (!section || !row) return;

    const duplicatedRow: PageBuilderRow = {
      ...row,
      id: generateId(),
      anchor: buildAnchor('row'),
      columns: row.columns.map(col => ({
        ...col,
        id: generateId(),
        anchor: buildAnchor('col'),
        elements: col.elements.map(el => ({
          ...el,
          id: generateId(),
          anchor: buildAnchor('element', el.type)
        }))
      }))
    };

    const rowIndex = section.rows!.findIndex(r => r.id === rowId);
    const newRows = [...section.rows!];
    newRows.splice(rowIndex + 1, 0, duplicatedRow);

    updateData({
      ...data,
      sections: data.sections.map(s =>
        s.id === sectionId
          ? { ...s, rows: newRows }
          : s
      )
    });
  }, [data, updateData]);

  const moveRow = useCallback((rowId: string, targetSectionId: string, insertIndex: number) => {
    
    
    const newData = { ...data };
    let rowToMove: PageBuilderRow | null = null;
    
    // Find and remove the row from its current location
    newData.sections.forEach(section => {
      const rowIndex = section.rows?.findIndex(row => row.id === rowId) ?? -1;
      if (rowIndex !== -1) {
        rowToMove = section.rows![rowIndex];
        section.rows!.splice(rowIndex, 1);
      }
    });

    if (!rowToMove) {
      console.error('Row not found:', rowId);
      return;
    }

    // Add the row to its new location
    const targetSection = newData.sections.find(section => section.id === targetSectionId);
    if (targetSection) {
      if (!targetSection.rows) targetSection.rows = [];
      targetSection.rows.splice(insertIndex, 0, rowToMove);
      updateData(newData);
    }
  }, [data, updateData]);

  const moveSection = useCallback((sectionId: string, insertIndex: number) => {
    
    
    const newData = { ...data };
    let sectionToMove: PageBuilderSection | null = null;
    const sectionIndex = newData.sections.findIndex(section => section.id === sectionId);
    
    if (sectionIndex !== -1) {
      sectionToMove = newData.sections[sectionIndex];
      newData.sections.splice(sectionIndex, 1);
      newData.sections.splice(insertIndex, 0, sectionToMove);
      updateData(newData);
    }
  }, [data, updateData]);

  // Section up/down movement functions
  const moveSectionUp = useCallback((sectionId: string) => {
    const sectionIndex = data.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex > 0) {
      moveSection(sectionId, sectionIndex - 1);
    }
  }, [data.sections, moveSection]);

  const moveSectionDown = useCallback((sectionId: string) => {
    const sectionIndex = data.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex < data.sections.length - 1) {
      moveSection(sectionId, sectionIndex + 1);
    }
  }, [data.sections, moveSection]);

  // Row up/down movement functions
  const moveRowUp = useCallback((sectionId: string, rowId: string) => {
    const section = data.sections.find(s => s.id === sectionId);
    if (!section?.rows) return;
    
    const rowIndex = section.rows.findIndex(r => r.id === rowId);
    if (rowIndex > 0) {
      moveRow(rowId, sectionId, rowIndex - 1);
    }
  }, [data.sections, moveRow]);

  const moveRowDown = useCallback((sectionId: string, rowId: string) => {
    const section = data.sections.find(s => s.id === sectionId);
    if (!section?.rows) return;
    
    const rowIndex = section.rows.findIndex(r => r.id === rowId);
    if (rowIndex < section.rows.length - 1) {
      moveRow(rowId, sectionId, rowIndex + 1);
    }
  }, [data.sections, moveRow]);

  // Column movement function
  const moveColumn = useCallback((sectionId: string, rowId: string, columnId: string, direction: 'up' | 'down') => {
    const newData = { ...data };
    const section = newData.sections.find(s => s.id === sectionId);
    const row = section?.rows?.find(r => r.id === rowId);
    
    if (!row?.columns) return;
    
    const columnIndex = row.columns.findIndex(c => c.id === columnId);
    const targetIndex = direction === 'up' ? columnIndex - 1 : columnIndex + 1;
    
    if (targetIndex >= 0 && targetIndex < row.columns.length) {
      // Swap columns
      const temp = row.columns[columnIndex];
      row.columns[columnIndex] = row.columns[targetIndex];
      row.columns[targetIndex] = temp;
      updateData(newData);
    }
  }, [data, updateData]);

  // Element up/down movement functions
  const moveElementUp = useCallback((sectionId: string, rowId: string, columnId: string, elementId: string) => {
    const newData = { ...data };
    const section = newData.sections.find(s => s.id === sectionId);
    const row = section?.rows?.find(r => r.id === rowId);
    const column = row?.columns.find(c => c.id === columnId);
    
    if (!column?.elements) return;
    
    const elementIndex = column.elements.findIndex(e => e.id === elementId);
    if (elementIndex > 0) {
      // Swap elements
      const temp = column.elements[elementIndex];
      column.elements[elementIndex] = column.elements[elementIndex - 1];
      column.elements[elementIndex - 1] = temp;
      updateData(newData);
    }
  }, [data, updateData]);

  const moveElementDown = useCallback((sectionId: string, rowId: string, columnId: string, elementId: string) => {
    const newData = { ...data };
    const section = newData.sections.find(s => s.id === sectionId);
    const row = section?.rows?.find(r => r.id === rowId);
    const column = row?.columns.find(c => c.id === columnId);
    
    if (!column?.elements) return;
    
    const elementIndex = column.elements.findIndex(e => e.id === elementId);
    if (elementIndex < column.elements.length - 1) {
      // Swap elements
      const temp = column.elements[elementIndex];
      column.elements[elementIndex] = column.elements[elementIndex + 1];
      column.elements[elementIndex + 1] = temp;
      updateData(newData);
    }
  }, [data, updateData]);

  // Helper function to get balanced layout for column count
  const getBalancedLayout = (columnCount: number): PageBuilderRow['columnLayout'] => {
    switch (columnCount) {
      case 1: return '1';
      case 2: return '1-1';
      case 3: return '1-1-1';
      case 4: return '1-1-1-1';
      case 5: return '1-1-1-1-1';
      case 6: return '1-1-1-1-1-1';
      default: return '1';
    }
  };

  // Add Column functionality
  const addColumn = useCallback((sectionId: string, rowId: string) => {
    const section = data.sections.find(s => s.id === sectionId);
    const row = section?.rows?.find(r => r.id === rowId);
    
    if (!row) return;
    
    // Prevent adding more than 6 columns
    if (row.columns.length >= 6) return;
    
    const newColumn: PageBuilderColumn = {
      id: generateId(),
      anchor: buildAnchor('col'),
      width: 1, // Will be adjusted by layout
      elements: [],
      styles: {
        paddingTop: '10px',
        paddingRight: '5px',
        paddingLeft: '5px',
        paddingBottom: '10px'
      }
    };

    const newColumnCount = row.columns.length + 1;
    const newLayout = getBalancedLayout(newColumnCount);
    const columnWidths = COLUMN_LAYOUTS[newLayout];

    updateData({
      ...data,
      sections: data.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              rows: (section.rows || []).map(r =>
                r.id === rowId
                  ? {
                      ...r,
                      columnLayout: newLayout,
                      columns: [
                        ...r.columns.map((col, index) => ({
                          ...col,
                          width: columnWidths[index] || 1
                        })),
                        { ...newColumn, width: columnWidths[newColumnCount - 1] || 1 }
                      ]
                    }
                  : r
              )
            }
          : section
      )
    });
  }, [data, updateData]);

  // Duplicate Column functionality
  const duplicateColumn = useCallback((sectionId: string, rowId: string, columnId: string) => {
    const section = data.sections.find(s => s.id === sectionId);
    const row = section?.rows?.find(r => r.id === rowId);
    const column = row?.columns.find(c => c.id === columnId);
    if (!section || !row || !column) return;

    // Check if adding another column would exceed 6 columns
    if (row.columns.length >= 6) {
      console.warn('Cannot duplicate column: Maximum 6 columns per row');
      return;
    }

    const duplicatedColumn: PageBuilderColumn = {
      ...column,
      id: generateId(),
      anchor: buildAnchor('col'),
      elements: column.elements.map(el => ({
        ...el,
        id: generateId(),
        anchor: buildAnchor('element', el.type)
      }))
    };

    const columnIndex = row.columns.findIndex(c => c.id === columnId);
    const newColumns = [...row.columns];
    newColumns.splice(columnIndex + 1, 0, duplicatedColumn);

    // Rebalance column widths to fit all columns
    const newColumnCount = newColumns.length;
    const newLayout = getBalancedLayout(newColumnCount);
    const columnWidths = COLUMN_LAYOUTS[newLayout];

    updateData({
      ...data,
      sections: data.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              rows: s.rows?.map(r =>
                r.id === rowId
                  ? { 
                      ...r, 
                      columnLayout: newLayout,
                      columns: newColumns.map((col, index) => ({
                        ...col,
                        width: columnWidths[index] || 1
                      }))
                    }
                  : r
              ) || []
            }
          : s
      )
    });
  }, [data, updateData]);

  // Delete Column functionality
  const deleteColumn = useCallback((sectionId: string, rowId: string, columnId: string) => {
    const section = data.sections.find(s => s.id === sectionId);
    const row = section?.rows?.find(r => r.id === rowId);
    
    if (!row) return;
    
    const columnIndex = row.columns.findIndex(c => c.id === columnId);
    const columnToDelete = row.columns[columnIndex];
    
    if (!columnToDelete) return;

    // If this is the last column, delete the entire row
    if (row.columns.length === 1) {
      deleteRow(sectionId, rowId);
      return;
    }

    // Find target column to merge elements into (prefer previous, otherwise next)
    const targetColumnIndex = columnIndex > 0 ? columnIndex - 1 : columnIndex + 1;
    const targetColumn = row.columns[targetColumnIndex];
    
    if (!targetColumn) return;

    // Merge elements from deleted column to target column
    const mergedElements = [...targetColumn.elements, ...columnToDelete.elements];
    
    // Remove the column and update layout
    const newColumns = row.columns.filter(c => c.id !== columnId);
    const newColumnCount = newColumns.length;
    const newLayout = getBalancedLayout(newColumnCount);
    const columnWidths = COLUMN_LAYOUTS[newLayout];

    updateData({
      ...data,
      sections: data.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              rows: (section.rows || []).map(r =>
                r.id === rowId
                  ? {
                      ...r,
                      columnLayout: newLayout,
                      columns: newColumns.map((col, index) => {
                        if (col.id === targetColumn.id) {
                          return {
                            ...col,
                            width: columnWidths[index] || 1,
                            elements: mergedElements
                          };
                        }
                        return {
                          ...col,
                          width: columnWidths[index] || 1
                        };
                      })
                    }
                  : r
              )
            }
          : section
      )
    });

    // Clear selection if it pointed to deleted column or its elements
    if (selection?.id === columnId || 
        (selection?.type === 'element' && columnToDelete.elements.some(el => el.id === selection.id))) {
      setSelection(null);
    }

    setDeleteColumnDialog(null);
  }, [data, updateData, selection, deleteRow]);

  // Element operations
  const addElement = useCallback((sectionId: string, rowId: string, columnId: string, elementType: string, insertIndex?: number) => {
    
    const elementDef = elementRegistry.get(elementType);
    if (!elementDef) {
      console.error('Element type not found in registry:', elementType);
      console.error('Available elements:', elementRegistry.getAll().map(e => e.id));
      return;
    }

    const newElement: PageBuilderElement = {
      id: generateId(),
      anchor: buildAnchor('element', elementType),
      type: elementType,
      content: { ...elementDef.defaultContent }
    };

    // Default styles for specific elements
    if (elementType === 'video') {
      newElement.styles = {
        paddingTop: '10px',
        paddingRight: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
      };
    }

    // Default CTA styles for buttons
    if (elementType === 'button') {
      newElement.styles = {
        backgroundColor: 'hsl(142.1 76.2% 36.3%)', // --success
        color: 'hsl(0 0% 100%)', // white text
        paddingTop: '12px',
        paddingRight: '24px',
        paddingBottom: '12px',
        paddingLeft: '24px',
        borderRadius: '6px',
        fontWeight: '600',
        fontSize: '32px',
        textAlign: 'center',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      };
    }

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
                          ? { 
                              ...col, 
                              elements: typeof insertIndex === 'number' 
                                ? [
                                    ...col.elements.slice(0, insertIndex),
                                    newElement,
                                    ...col.elements.slice(insertIndex)
                                  ]
                                : [...col.elements, newElement]
                            }
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

    // Auto-select the new element
    setSelection({ type: 'element', id: newElement.id, parentId: columnId, grandParentId: rowId });
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

  // Update section, row, or column
  const updateSection = useCallback((sectionId: string, updates: Partial<PageBuilderSection>) => {
    
    updateData({
      ...data,
      sections: data.sections.map(section =>
        section.id === sectionId 
          ? { 
              ...section, 
              ...updates,
              styles: updates.styles ? updates.styles : section.styles
            } 
          : section
      )
    });
  }, [data, updateData]);

  const updateRow = useCallback((sectionId: string, rowId: string, updates: Partial<PageBuilderRow>) => {
    
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
                      ...updates,
                      styles: updates.styles ? updates.styles : row.styles
                    } 
                  : row
              )
            }
          : section
      )
    });
  }, [data, updateData]);

  const updateColumn = useCallback((sectionId: string, rowId: string, columnId: string, updates: Partial<PageBuilderColumn>) => {
    
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
                          ? { 
                              ...col, 
                              ...updates,
                              styles: updates.styles ? updates.styles : col.styles
                            } 
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
    if (selection?.id === elementId) setSelection(null);
  }, [data, updateData, selection]);

  const moveElement = useCallback((elementId: string, targetSectionId: string, targetRowId: string, targetColumnId: string, insertIndex: number) => {
    
    
    // Find and remove the element from its current location
    let elementToMove: PageBuilderElement | null = null;
    const newData = {
      ...data,
      sections: data.sections.map(section => ({
        ...section,
        rows: (section.rows || []).map(row => ({
          ...row,
          columns: row.columns.map(col => ({
            ...col,
            elements: col.elements.filter(el => {
              if (el.id === elementId) {
                elementToMove = el;
                return false;
              }
              return true;
            })
          }))
        }))
      }))
    };

    // Insert the element at the target location
    if (elementToMove) {
      newData.sections = newData.sections.map(section =>
        section.id === targetSectionId
          ? {
              ...section,
              rows: (section.rows || []).map(row =>
                row.id === targetRowId
                  ? {
                      ...row,
                      columns: row.columns.map(col =>
                        col.id === targetColumnId
                          ? {
                              ...col,
                              elements: [
                                ...col.elements.slice(0, insertIndex),
                                elementToMove!,
                                ...col.elements.slice(insertIndex)
                              ]
                            }
                          : col
                      )
                    }
                  : row
              )
            }
          : section
      );
    }

    updateData(newData);
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

  const getPageStyles = () => {
    const pageStyles = data.pageStyles;
    if (!pageStyles) return {};

    const styles: React.CSSProperties = {};

    // Background styles
    if (pageStyles.backgroundColor) {
      styles.backgroundColor = pageStyles.backgroundColor;
    }

    if (pageStyles.backgroundImage) {
      styles.backgroundImage = `url(${pageStyles.backgroundImage})`;
      styles.backgroundRepeat = pageStyles.backgroundRepeat || 'no-repeat';
      styles.backgroundPosition = pageStyles.backgroundPosition || 'center';
      styles.backgroundSize = pageStyles.backgroundSize || 'cover';
    }

    // Padding and margins
    if (pageStyles.paddingTop) styles.paddingTop = pageStyles.paddingTop;
    if (pageStyles.paddingRight) styles.paddingRight = pageStyles.paddingRight;
    if (pageStyles.paddingBottom) styles.paddingBottom = pageStyles.paddingBottom;
    if (pageStyles.paddingLeft) styles.paddingLeft = pageStyles.paddingLeft;

    if (pageStyles.marginTop) styles.marginTop = pageStyles.marginTop;
    if (pageStyles.marginRight) styles.marginRight = pageStyles.marginRight;
    if (pageStyles.marginBottom) styles.marginBottom = pageStyles.marginBottom;
    if (pageStyles.marginLeft) styles.marginLeft = pageStyles.marginLeft;

    return styles;
  };

  // Build element library from registry
  const allElements = elementRegistry.getAll();
  const elementsByCategory = allElements.reduce((acc, el) => {
    const cat = el.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(el);
    return acc;
  }, {} as Record<string, typeof allElements>);

  const filteredElements = Object.entries(elementsByCategory)
    .map(([cat, elements]) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      elements: elements.filter((element) =>
        element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (element.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }))
    .filter(category => category.elements.length > 0);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full min-h-0 bg-background relative">
        {/* Floating Elements Panel */}
        <div 
          className={`fixed top-0 left-0 w-80 h-full bg-card border-r shadow-lg z-50 overflow-hidden transition-transform duration-300 ease-out ${
            isElementsPanelOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          ref={elementsPanelRef}
        >
          <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Elements</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsElementsPanelOpen(false)}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
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
            </div>
            
            <ScrollArea scrollbarType="always" className="flex-1 min-h-0 h-[calc(100%-140px)]">
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
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top Toolbar */}
          <div className="border-b bg-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsElementsPanelOpen(!isElementsPanelOpen)}
                className="flex items-center gap-2"
                data-elements-panel-toggle
              >
                <Plus className="h-4 w-4" />
                Elements
              </Button>
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
            </div>
          </div>

          {/* Canvas Area */}
          <CanvasAreaWithAutoscroll 
            data={data}
            deviceType={deviceType}
            selection={selection}
            setSelection={setSelection}
            deleteSection={deleteSection}
            duplicateSection={duplicateSection}
            setShowColumnModal={setShowColumnModal}
            deleteRow={deleteRow}
            duplicateRow={duplicateRow}
            moveRow={moveRow}
            moveRowUp={moveRowUp}
            moveRowDown={moveRowDown}
            moveElement={moveElement}
            moveElementUp={moveElementUp}
            moveElementDown={moveElementDown}
            moveSection={moveSection}
            moveSectionUp={moveSectionUp}
            moveSectionDown={moveSectionDown}
            moveColumn={moveColumn}
            addColumn={addColumn}
            duplicateColumn={duplicateColumn}
            setDeleteColumnDialog={setDeleteColumnDialog}
            addElement={addElement}
            updateElement={updateElement}
            deleteElement={deleteElement}
            duplicateElement={duplicateElement}
            addSectionAfter={addSectionAfter}
            addSection={addSection}
            getDevicePreviewStyles={getDevicePreviewStyles}
            getPageStyles={getPageStyles}
          />
        </div>

        {/* Properties Panel */}
        <div className={`flex flex-col min-h-0 border-l bg-card transition-all duration-300 ${propertiesPanelCollapsed ? 'w-12' : 'w-80'}`}>
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
            <ScrollArea scrollbarType="always" className="flex-1 min-h-0">
              {selection ? (
                (() => {
                  // Get selected item data based on selection type
                  let selectedItem = null;
                  let updateHandler = null;

                  if (selection.type === 'element') {
                    const element = findElement(selection.id);
                    if (element) {
                      selectedItem = { type: 'element', data: element };
                      updateHandler = (elementId: string, updates: any) => {
                        
                        updateElement(elementId, updates);
                      };
                    }
                  } else if (selection.type === 'section') {
                    const section = data.sections.find(s => s.id === selection.id);
                    if (section) {
                      selectedItem = { type: 'section', data: section };
                      updateHandler = (updates: any) => updateSection(selection.id, updates);
                    }
                  } else if (selection.type === 'row') {
                    const section = data.sections.find(s => s.id === selection.parentId);
                    const row = section?.rows?.find(r => r.id === selection.id);
                    if (row && section) {
                      selectedItem = { type: 'row', data: row };
                      updateHandler = (updates: any) => updateRow(section.id, selection.id, updates);
                    }
                  } else if (selection.type === 'column') {
                    const section = data.sections.find(s => s.id === selection.grandParentId);
                    const row = section?.rows?.find(r => r.id === selection.parentId);
                    const column = row?.columns.find(c => c.id === selection.id);
                    if (column && section && row) {
                      selectedItem = { type: 'column', data: column };
                      updateHandler = (updates: any) => updateColumn(section.id, row.id, selection.id, updates);
                    }
                  }

                  if (selection.type === 'element' && selectedItem) {
                    return (
                      <PropertiesPanel
                        selectedElement={selectedItem.data as PageBuilderElement}
                        deviceType={deviceType}
                        onUpdateElement={updateHandler}
                      />
                    );
                  } else {
                    return (
                      <SettingsPanel
                        selectedItem={selectedItem}
                        onUpdate={updateHandler}
                      />
                    );
                  }
                })()
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Select an element to edit properties</p>
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Column Layout Modal */}
      <ColumnLayoutModal
        isOpen={!!showColumnModal}
        onClose={() => setShowColumnModal(null)}
        onSelectLayout={(layout) => {
          if (showColumnModal) {
            addRow(showColumnModal.sectionId, layout, showColumnModal.insertIndex);
          }
        }}
      />

      {/* Delete Column Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteColumnDialog !== null}
        onOpenChange={(open) => !open && setDeleteColumnDialog(null)}
        title="Delete Column"
        description={(() => {
          if (!deleteColumnDialog) return "";
          const section = data.sections.find(s => s.id === deleteColumnDialog.sectionId);
          const row = section?.rows?.find(r => r.id === deleteColumnDialog.rowId);
          const isLastColumn = row?.columns.length === 1;
          
          return isLastColumn 
            ? "Deleting the last column will remove the entire row. This action cannot be undone."
            : "Deleting this column will move its content to the previous column. This action cannot be undone.";
        })()}
        confirmText="Delete Column"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (deleteColumnDialog) {
            deleteColumn(deleteColumnDialog.sectionId, deleteColumnDialog.rowId, deleteColumnDialog.columnId);
          }
        }}
      />
    </DndProvider>
  );
});

// Draggable Element Component
interface DraggableElementProps {
  element: {
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
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
  totalSections: number;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddRow: (insertIndex?: number) => void;
  onDeleteRow: (rowId: string) => void;
  onDuplicateRow: (rowId: string) => void;
  onMoveRow: (rowId: string, targetSectionId: string, insertIndex: number) => void;
  onMoveRowUp: (sectionId: string, rowId: string) => void;
  onMoveRowDown: (sectionId: string, rowId: string) => void;
  onMoveElement: (elementId: string, targetSectionId: string, targetRowId: string, targetColumnId: string, insertIndex: number) => void;
  onMoveElementUp: (sectionId: string, rowId: string, columnId: string, elementId: string) => void;
  onMoveElementDown: (sectionId: string, rowId: string, columnId: string, elementId: string) => void;
  onMoveSection: (sectionId: string, insertIndex: number) => void;
  onMoveSectionUp: () => void;
  onMoveSectionDown: () => void;
  onMoveColumn: (sectionId: string, rowId: string, columnId: string, direction: 'up' | 'down') => void;
  onAddColumn: (sectionId: string, rowId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onDuplicateColumn: (columnId: string) => void;
  onAddElement: (sectionId: string, rowId: string, columnId: string, elementType: string, insertIndex?: number) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateElement: (elementId: string) => void;
  selection: SelectionType | null;
  onSelectionChange: (selection: SelectionType | null) => void;
  onAddSectionAfter: () => void;
}

const SectionComponent: React.FC<SectionComponentProps> = ({
  section,
  sectionIndex,
  totalSections,
  deviceType,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onAddRow,
  onDeleteRow,
  onDuplicateRow,
  onMoveRow,
  onMoveRowUp,
  onMoveRowDown,
  onMoveElement,
  onMoveElementUp,
  onMoveElementDown,
  onMoveSection,
  onMoveSectionUp,
  onMoveSectionDown,
  onMoveColumn,
  onAddColumn,
  onDeleteColumn,
  onDuplicateColumn,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  selection,
  onSelectionChange,
  onAddSectionAfter
}) => {
  const { hoveredTarget, setHoveredTarget } = useHover();
  const userBackground = hasUserBackground(section.styles);
  const userShadow = hasUserShadow(section.styles);
  
  const isHoveredTarget = hoveredTarget?.type === 'section' && hoveredTarget?.id === section.id;
  const shouldShowToolbar = isSelected || isHoveredTarget;

  // Section drag functionality
  const [{ isDragging }, dragRef] = useDrag({
    type: 'section',
    item: { sectionId: section.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  return (
    <div 
      ref={dragRef}
      id={`section-${section.id}`}
      data-anchor={section.anchor}
      data-pb-section-id={section.id}
      className={`relative group transition-all duration-200 ${
        // Only apply border/background styles if no user-defined styles and not in preview mode
        !userBackground && !userShadow ? 'border-2 border-dashed' : ''
      } ${
        isSelected && !userBackground 
          ? 'border-primary bg-primary/5' 
          : isHoveredTarget && !userBackground
            ? 'border-primary/50 bg-primary/2' 
            : !userBackground ? 'border-transparent' : ''
      } ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={renderSectionStyles(section, deviceType)}
      onMouseEnter={() => setHoveredTarget({ type: 'section', id: section.id })}
      onMouseLeave={() => setHoveredTarget(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Overlay border for sections with background/shadow */}
      {shouldShowToolbar && (userBackground || userShadow) && (
        <div 
          className={`absolute inset-0 pointer-events-none z-30 border-2 border-dashed ${
            isSelected ? 'border-primary' : 'border-primary/50'
          }`}
          style={{ borderRadius: 'inherit' }}
        />
      )}
      {/* Section Toolbar */}
      {shouldShowToolbar && (
        <div className="absolute -top-12 left-0 z-40 flex items-center gap-1 bg-sky-100 text-gray-800 border border-sky-200 px-3 py-1 rounded-md text-xs shadow-lg">
          <Grip className="h-3 w-3" />
          <span className="font-medium">Section</span>
          <Separator orientation="vertical" className="mx-1 h-4" />
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 hover:bg-gray-100" 
            onClick={(e) => {
              e.stopPropagation();
              onMoveSectionUp();
            }}
            disabled={sectionIndex === 0}
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 hover:bg-gray-100" 
            onClick={(e) => {
              e.stopPropagation();
              onMoveSectionDown();
            }}
            disabled={sectionIndex === totalSections - 1}
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
           <Button 
             variant="ghost" 
             size="sm" 
             className="h-6 w-6 p-0 hover:bg-gray-100" 
             onClick={(e) => {
               e.stopPropagation();
               onAddRow();
             }}
           >
             <Plus className="h-3 w-3" />
           </Button>
           <Button 
             variant="ghost" 
             size="sm" 
             className="h-6 w-6 p-0 hover:bg-gray-100" 
             onClick={(e) => {
               e.stopPropagation();
               onAddSectionAfter();
             }}
           >
             <Plus className="h-3 w-3" />
           </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100" onClick={onDuplicate}>
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onSelectionChange({ type: 'section', id: section.id });
            }}
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div 
        className={cn(
          "w-full mx-auto p-4 flex flex-col",
          (() => {
            // Get device-aware vertical alignment
            const verticalAlignment = section.styles?.responsive?.[deviceType]?.contentVerticalAlignment || 
                                     section.styles?.contentVerticalAlignment;
            
            // Only apply alignment if section has a specific height or minHeight
            const sectionHeight = section.styles?.responsive?.[deviceType]?.height || section.styles?.height;
            const sectionMinHeight = section.styles?.responsive?.[deviceType]?.minHeight || section.styles?.minHeight;
            if ((!sectionHeight || sectionHeight === 'auto') && (!sectionMinHeight || sectionMinHeight === 'auto')) return 'justify-start';
            
            return verticalAlignment === 'center' ? 'justify-center' :
                   verticalAlignment === 'bottom' ? 'justify-end' : 'justify-start';
          })()
        )}
        style={{ 
          maxWidth: SECTION_WIDTHS[section.width],
          minHeight: 'inherit'
        }}
      >
        {(!section.rows || section.rows.length === 0) ? (
          <div className="p-12 text-center border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground mb-4">This section is empty</p>
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation();
                onAddRow();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </div>
        ) : (
          <div className="space-y-0">
                {/* Drop zone at the beginning */}
                <RowDropZone
                  sectionId={section.id}
                  insertIndex={0}
                  onMoveRow={onMoveRow}
                />
                
                {(section.rows || []).map((row, index) => (
                  <div key={row.id}>
                    <RowComponent
                      row={row}
                      rowIndex={index}
                      totalRows={(section.rows || []).length}
                      sectionId={section.id}
                      deviceType={deviceType}
                      isSelected={selection?.type === 'row' && selection.id === row.id}
                      onSelect={() => onSelectionChange({ type: 'row', id: row.id, parentId: section.id })}
                      onDelete={() => onDeleteRow(row.id)}
                      onDuplicate={() => onDuplicateRow(row.id)}
                      onAddRow={() => onAddRow(index + 1)}
                      onMoveRowUp={() => onMoveRowUp(section.id, row.id)}
                      onMoveRowDown={() => onMoveRowDown(section.id, row.id)}
                      onMoveElementUp={onMoveElementUp}
                      onMoveElementDown={onMoveElementDown}
                       onMoveElement={onMoveElement}
                       onMoveColumn={onMoveColumn}
                        onAddColumn={onAddColumn}
                        onDeleteColumn={onDeleteColumn}
                        onDuplicateColumn={onDuplicateColumn}
                        onAddElement={onAddElement}
                       onUpdateElement={onUpdateElement}
                       onDeleteElement={onDeleteElement}
                       onDuplicateElement={onDuplicateElement}
                       selection={selection}
                       onSelectionChange={onSelectionChange}
                    />
                    
                    {/* Drop zone after each row */}
                    <RowDropZone
                      sectionId={section.id}
                      insertIndex={index + 1}
                      onMoveRow={onMoveRow}
                    />
                  </div>
                ))}
                
                {/* Add Row button at end */}
                <div className="pt-4 text-center">
                  <Button variant="outline" size="sm" onClick={() => onAddRow()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row
                  </Button>
                </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Row Component
interface RowComponentProps {
  row: PageBuilderRow;
  rowIndex: number;
  totalRows: number;
  sectionId: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddRow: () => void;
  onMoveRowUp: () => void;
  onMoveRowDown: () => void;
  onMoveElement: (elementId: string, targetSectionId: string, targetRowId: string, targetColumnId: string, insertIndex: number) => void;
  onMoveElementUp: (sectionId: string, rowId: string, columnId: string, elementId: string) => void;
  onMoveElementDown: (sectionId: string, rowId: string, columnId: string, elementId: string) => void;
  onMoveColumn: (sectionId: string, rowId: string, columnId: string, direction: 'up' | 'down') => void;
  onAddColumn: (sectionId: string, rowId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onDuplicateColumn: (columnId: string) => void;
  onAddElement: (sectionId: string, rowId: string, columnId: string, elementType: string, insertIndex?: number) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateElement: (elementId: string) => void;
  selection: SelectionType | null;
  onSelectionChange: (selection: SelectionType | null) => void;
}

const RowComponent: React.FC<RowComponentProps> = ({
  row,
  rowIndex,
  totalRows,
  sectionId,
  deviceType,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onAddRow,
  onMoveRowUp,
  onMoveRowDown,
  onMoveElement,
  onMoveElementUp,
  onMoveElementDown,
  onMoveColumn,
  onAddColumn,
  onDeleteColumn,
  onDuplicateColumn,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  selection,
  onSelectionChange
}) => {
  const { hoveredTarget, setHoveredTarget } = useHover();
  const userBackground = hasUserBackground(row.styles);
  const userShadow = hasUserShadow(row.styles);
  
  const isHoveredTarget = hoveredTarget?.type === 'row' && hoveredTarget?.id === row.id;
  const shouldShowToolbar = isSelected || isHoveredTarget;

  // Row drag functionality
  const [{ isDragging }, dragRef] = useDrag({
    type: 'row',
    item: { rowId: row.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  return (
    <div 
      ref={dragRef}
      id={`row-${row.id}`}
      data-anchor={row.anchor}
      data-pb-row-id={row.id}
      className={`relative group transition-all duration-200 ${
        // Only show borders when hovering or selected
        shouldShowToolbar && !userBackground && !userShadow ? 'border-2 border-dashed border-blue-400' : ''
      } ${
        isSelected && !userBackground
          ? 'border-blue-600 bg-blue-50/50' 
          : isHoveredTarget && !userBackground
            ? 'border-blue-500 bg-blue-50/30' 
            : ''
      } ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={renderRowStyles(row, deviceType)}
      onMouseEnter={() => setHoveredTarget({ type: 'row', id: row.id, parentId: sectionId })}
      onMouseLeave={() => setHoveredTarget(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Overlay border for rows with background/shadow */}
      {shouldShowToolbar && (userBackground || userShadow) && (
        <div 
          className={`absolute inset-0 pointer-events-none z-30 border-2 border-dashed ${
            isSelected ? 'border-blue-600' : 'border-blue-500'
          }`}
          style={{ borderRadius: 'inherit' }}
        />
      )}

      {/* Row Toolbar */}
      {shouldShowToolbar && (
        <div className="absolute -top-10 left-0 z-40 flex items-center gap-1 bg-violet-100 text-gray-800 border border-violet-200 px-3 py-1 rounded-md text-xs shadow-lg">
          <div ref={dragRef} className="cursor-move">
            <Grip className="h-3 w-3" />
          </div>
          <span className="font-medium">Row ({row.columnLayout})</span>
          <Separator orientation="vertical" className="mx-1 h-4" />
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onMoveRowUp();
            }}
            disabled={rowIndex === 0}
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onMoveRowDown();
            }}
            disabled={rowIndex === totalRows - 1}
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onAddColumn(sectionId, row.id);
            }}
            disabled={row.columns.length >= 6}
            title={row.columns.length >= 6 ? "Maximum 6 columns allowed" : "Add Column"}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            title="Duplicate Row"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onSelectionChange({ type: 'row', id: row.id, parentId: sectionId });
            }}
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div 
        className={`grid ${getResponsiveGridClasses(row.columnLayout, deviceType)}`}
        style={{ gap: '16px' }}
      >
        {row.columns.map((column, columnIndex) => (
          <ColumnComponent
            key={column.id}
            column={column}
            columnIndex={columnIndex}
            totalColumns={row.columns.length}
            rowId={row.id}
            sectionId={sectionId}
            deviceType={deviceType}
            isSelected={selection?.type === 'column' && selection.id === column.id}
            onSelect={() => onSelectionChange({ 
              type: 'column', 
              id: column.id, 
              parentId: row.id, 
              grandParentId: sectionId 
            })}
            onMoveColumnUp={() => onMoveColumn(sectionId, row.id, column.id, 'up')}
            onMoveColumnDown={() => onMoveColumn(sectionId, row.id, column.id, 'down')}
            onDeleteColumn={() => onDeleteColumn(column.id)}
            onDuplicateColumn={() => onDuplicateColumn(column.id)}
            canDeleteColumn={true}
            onMoveElementUp={onMoveElementUp}
            onMoveElementDown={onMoveElementDown}
            onAddElement={onAddElement}
            onMoveElement={onMoveElement}
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
  columnIndex: number;
  totalColumns: number;
  rowId: string;
  sectionId: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  isSelected: boolean;
  onSelect: () => void;
  onMoveColumnUp: () => void;
  onMoveColumnDown: () => void;
  onDeleteColumn: () => void;
  onDuplicateColumn: () => void;
  canDeleteColumn: boolean;
  onMoveElementUp: (sectionId: string, rowId: string, columnId: string, elementId: string) => void;
  onMoveElementDown: (sectionId: string, rowId: string, columnId: string, elementId: string) => void;
  onAddElement: (sectionId: string, rowId: string, columnId: string, elementType: string, insertIndex?: number) => void;
  onMoveElement: (elementId: string, targetSectionId: string, targetRowId: string, targetColumnId: string, insertIndex: number) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateElement: (elementId: string) => void;
  selection: SelectionType | null;
  onSelectionChange: (selection: SelectionType | null) => void;
}

const ColumnComponent: React.FC<ColumnComponentProps> = ({
  column,
  columnIndex,
  totalColumns,
  rowId,
  sectionId,
  deviceType,
  isSelected,
  onSelect,
  onMoveColumnUp,
  onMoveColumnDown,
  onDeleteColumn,
  onDuplicateColumn,
  canDeleteColumn,
  onMoveElementUp,
  onMoveElementDown,
  onAddElement,
  onMoveElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  selection,
  onSelectionChange
}) => {
  const { hoveredTarget, setHoveredTarget } = useHover();
  const userBackground = hasUserBackground(column.styles);
  const userShadow = hasUserShadow(column.styles);
  
  const isHoveredTarget = hoveredTarget?.type === 'column' && hoveredTarget?.id === column.id;
  const shouldShowToolbar = isSelected || isHoveredTarget;

  const handleAddElement = (elementType: string, insertIndex: number) => {
    
    onAddElement(sectionId, rowId, column.id, elementType, insertIndex);
  };

  return (
    <div 
      id={`column-${column.id}`}
      data-anchor={column.anchor}
      data-pb-column-id={column.id}
      className={`relative min-h-24 transition-all duration-200 ${
        // Only show borders when hovering or selected
        shouldShowToolbar && !userBackground && !userShadow ? 'border-2 border-dashed border-gray-300' : ''
      } ${
        isSelected && !userBackground
          ? 'border-primary/60 bg-primary/5' 
          : isHoveredTarget && !userBackground
            ? 'border-primary/50 bg-primary/3' 
            : ''
      }`}
      style={renderColumnStyles(column, deviceType)}
      onMouseEnter={() => setHoveredTarget({ type: 'column', id: column.id, parentId: rowId, grandParentId: sectionId })}
      onMouseLeave={() => setHoveredTarget(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Overlay border for columns with background/shadow */}
      {shouldShowToolbar && (userBackground || userShadow) && (
        <div 
          className={`absolute inset-0 pointer-events-none z-30 border-2 border-dashed ${
            isSelected ? 'border-primary/60' : 'border-primary/50'
          }`}
          style={{ borderRadius: 'inherit' }}
        />
      )}

      {/* Column Toolbar */}
      {shouldShowToolbar && (
        <div className="absolute -top-8 left-0 z-40 flex items-center gap-1 bg-emerald-100 text-gray-800 border border-emerald-200 px-2 py-1 rounded text-xs shadow-lg">
          <Grip className="h-3 w-3" />
          <span className="font-medium">Column</span>
          <Separator orientation="vertical" className="mx-1 h-3" />
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onMoveColumnUp();
            }}
            disabled={columnIndex === 0}
          >
            <ArrowUp className="h-2 w-2" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onMoveColumnDown();
            }}
            disabled={columnIndex === totalColumns - 1}
          >
            <ArrowDown className="h-2 w-2" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateColumn();
            }}
            title="Duplicate Column"
            disabled={totalColumns >= 6}
          >
            <Copy className="h-2 w-2" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0 hover:bg-red-100 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteColumn();
            }}
            title="Delete column"
          >
            <Trash2 className="h-2 w-2" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <Settings className="h-2 w-2" />
          </Button>
        </div>
      )}

      <div className="p-2">
        {/* Drop zone at top of column */}
        <ElementDropZone
          sectionId={sectionId}
          rowId={rowId}
          columnId={column.id}
          insertIndex={0}
          onAddElement={handleAddElement}
          onMoveElement={(elementId, insertIndex) => onMoveElement(elementId, sectionId, rowId, column.id, insertIndex)}
          className="mb-2"
        />

        {column.elements.length === 0 ? (
          <div className="h-20 flex flex-col items-center justify-center text-muted-foreground text-sm">
            <Plus className="h-6 w-6 mb-2 opacity-50" />
            <span>Drop elements here</span>
          </div>
        ) : (
          <div>
            {column.elements.map((element, index) => (
              <div key={element.id}>
                <ElementWrapper
                  element={element}
                  elementIndex={index}
                  totalElements={column.elements.length}
                  columnId={column.id}
                  rowId={rowId}
                  sectionId={sectionId}
                  deviceType={deviceType}
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
                  onMoveElementUp={() => onMoveElementUp(sectionId, rowId, column.id, element.id)}
                  onMoveElementDown={() => onMoveElementDown(sectionId, rowId, column.id, element.id)}
                />
                
                {/* Drop zone after each element */}
                <ElementDropZone
                  sectionId={sectionId}
                  rowId={rowId}
                  columnId={column.id}
                  insertIndex={index + 1}
                  onAddElement={handleAddElement}
                  onMoveElement={(elementId, insertIndex) => onMoveElement(elementId, sectionId, rowId, column.id, insertIndex)}
                  className="my-2"
                />
              </div>
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
  elementIndex: number;
  totalElements: number;
  columnId: string;
  rowId: string;
  sectionId: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onDelete: (elementId: string) => void;
  onDuplicate: (elementId: string) => void;
  onMoveElementUp: () => void;
  onMoveElementDown: () => void;
}

const ElementWrapper: React.FC<ElementWrapperProps> = ({
  element,
  elementIndex,
  totalElements,
  columnId,
  rowId,
  sectionId,
  deviceType,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveElementUp,
  onMoveElementDown
}) => {
  const { hoveredTarget, setHoveredTarget } = useHover();
  const elementDef = elementRegistry.get(element.type);
  
  const isHoveredTarget = hoveredTarget?.type === 'element' && hoveredTarget?.id === element.id;
  const shouldShowToolbar = isSelected || isHoveredTarget;

  // Element drag functionality
  const [{ isDragging }, dragRef] = useDrag({
    type: 'element',
    item: { 
      elementId: element.id,
      sourceColumnId: columnId,
      sourceRowId: rowId,
      sourceSectionId: sectionId
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  if (!elementDef) {
    return (
      <div className="p-4 border border-destructive rounded text-destructive text-sm">
        Unknown element type: {element.type}
      </div>
    );
  }

  return (
    <div
      ref={dragRef}
      id={element.anchor}
      data-pb-element-id={element.id}
      className={`relative group border transition-all duration-200 rounded ${
        isSelected 
          ? 'border-primary bg-primary/5' 
          : isHoveredTarget 
            ? 'border-primary/50' 
            : 'border-transparent'
      } ${
        isDragging ? 'opacity-50' : ''
      }`}
      onMouseEnter={() => setHoveredTarget({ type: 'element', id: element.id, parentId: columnId, grandParentId: rowId })}
      onMouseLeave={() => setHoveredTarget(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Element Toolbar */}
      {shouldShowToolbar && (
        <div className="absolute -top-8 left-0 z-40 flex items-center gap-1 bg-amber-100 text-gray-800 border border-amber-200 px-2 py-1 rounded text-xs shadow-lg">
          <div 
            ref={dragRef}
            className="flex items-center cursor-move hover:bg-gray-100 p-1 rounded"
          >
            <Grip className="h-3 w-3" />
          </div>
          <elementDef.icon className="h-3 w-3" />
          <span className="font-medium">{elementDef.name}</span>
          <Separator orientation="vertical" className="mx-1 h-3" />
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-gray-100">
            <Edit className="h-2 w-2" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0 hover:bg-gray-100"
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
            className="h-5 w-5 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onMoveElementUp();
            }}
            disabled={elementIndex === 0}
          >
            <ArrowUp className="h-2 w-2" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onMoveElementDown();
            }}
            disabled={elementIndex === totalElements - 1}
          >
            <ArrowDown className="h-2 w-2" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0 hover:bg-red-100 hover:text-red-600" 
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
        deviceType={deviceType}
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
    { id: '1', name: 'Single Column', widths: COLUMN_LAYOUTS['1'] },
    { id: '1-1', name: 'Two Columns (50/50)', widths: COLUMN_LAYOUTS['1-1'] },
    { id: '1-2', name: 'Two Columns (33/67)', widths: COLUMN_LAYOUTS['1-2'] },
    { id: '2-1', name: 'Two Columns (67/33)', widths: COLUMN_LAYOUTS['2-1'] },
    { id: '1-1-1', name: 'Three Columns', widths: COLUMN_LAYOUTS['1-1-1'] },
    { id: '1-2-1', name: 'Three Columns (25/50/25)', widths: COLUMN_LAYOUTS['1-2-1'] },
    { id: '2-1-1', name: 'Three Columns (50/25/25)', widths: COLUMN_LAYOUTS['2-1-1'] },
    { id: '1-1-1-1', name: 'Four Columns', widths: COLUMN_LAYOUTS['1-1-1-1'] },
  ] as const;

  const getGridTemplateColumns = (widths: readonly number[]) => {
    return widths.map(width => `${width}fr`).join(' ');
  };

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
              className="h-auto p-4 flex flex-col items-center space-y-3 hover:border-blue-200 hover:bg-blue-500 hover:shadow-md transition-all duration-200 border-2 group"
              onClick={() => onSelectLayout(layout.id)}
            >
              {/* Visual Preview */}
              <div 
                className="w-full h-10 grid gap-1.5 bg-muted/30 p-2 rounded border"
                style={{ gridTemplateColumns: getGridTemplateColumns(layout.widths) }}
              >
                {layout.widths.map((_, index) => (
                  <div 
                    key={index} 
                    className="bg-blue-200 rounded-sm border border-blue-300"
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-center group-hover:text-white transition-colors">{layout.name}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Canvas Area with Autoscroll Component
interface CanvasAreaWithAutoscrollProps {
  data: PageBuilderData;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  selection: SelectionType | null;
  setSelection: (selection: SelectionType | null) => void;
  deleteSection: (sectionId: string) => void;
  duplicateSection: (sectionId: string) => void;
  setShowColumnModal: (value: { sectionId: string; insertIndex?: number } | null) => void;
  deleteRow: (sectionId: string, rowId: string) => void;
  duplicateRow: (sectionId: string, rowId: string) => void;
  moveRow: (rowId: string, targetSectionId: string, insertIndex: number) => void;
  moveRowUp: (sectionId: string, rowId: string) => void;
  moveRowDown: (sectionId: string, rowId: string) => void;
  moveElement: (elementId: string, targetSectionId: string, targetRowId: string, targetColumnId: string, insertIndex: number) => void;
  moveElementUp: (sectionId: string, rowId: string, columnId: string, elementId: string) => void;
  moveElementDown: (sectionId: string, rowId: string, columnId: string, elementId: string) => void;
  moveSection: (sectionId: string, insertIndex: number) => void;
  moveSectionUp: (sectionId: string) => void;
  moveSectionDown: (sectionId: string) => void;
  moveColumn: (sectionId: string, rowId: string, columnId: string, direction: 'up' | 'down') => void;
  addColumn: (sectionId: string, rowId: string) => void;
  duplicateColumn: (sectionId: string, rowId: string, columnId: string) => void;
  setDeleteColumnDialog: (value: any) => void;
  addElement: (sectionId: string, rowId: string, columnId: string, elementType: string, insertIndex?: number) => void;
  updateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  deleteElement: (elementId: string) => void;
  duplicateElement: (elementId: string) => void;
  addSectionAfter: (sectionIndex: number) => void;
  addSection: () => void;
  getDevicePreviewStyles: () => any;
  getPageStyles: () => any;
}

const CanvasAreaWithAutoscroll: React.FC<CanvasAreaWithAutoscrollProps> = ({
  data,
  deviceType,
  selection,
  setSelection,
  deleteSection,
  duplicateSection,
  setShowColumnModal,
  deleteRow,
  duplicateRow,
  moveRow,
  moveRowUp,
  moveRowDown,
  moveElement,
  moveElementUp,
  moveElementDown,
  moveSection,
  moveSectionUp,
  moveSectionDown,
  moveColumn,
  addColumn,
  duplicateColumn,
  setDeleteColumnDialog,
  addElement,
  updateElement,
  deleteElement,
  duplicateElement,
  addSectionAfter,
  addSection,
  getDevicePreviewStyles,
  getPageStyles
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Initialize autoscroll for drag operations - this is now inside DndProvider context
  useDragAutoscroll(canvasRef);

  return (
    <ScrollArea ref={canvasRef} scrollbarType="always" className="flex-1 min-h-0 bg-muted/30">
      <div className="p-8">
        <div style={{ ...getDevicePreviewStyles(), ...getPageStyles() }} className={cn("min-h-full bg-background rounded-lg shadow-sm", deviceType === 'mobile' && "pb-mobile", deviceType === 'tablet' && "pb-tablet")}>
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
            <div className="space-y-0">
              {/* Section drop zone at the beginning */}
              <SectionDropZone 
                insertIndex={0} 
                onMoveSection={moveSection}
              />
              
              {data.sections.map((section, sectionIndex) => (
                <div key={section.id}>
                  <SectionComponent
                    section={section}
                    sectionIndex={sectionIndex}
                    totalSections={data.sections.length}
                    deviceType={deviceType}
                    isSelected={selection?.type === 'section' && selection.id === section.id}
                    onSelect={() => setSelection({ type: 'section', id: section.id })}
                    onDelete={() => deleteSection(section.id)}
                    onDuplicate={() => duplicateSection(section.id)}
                    onAddRow={(insertIndex?: number) => setShowColumnModal({ sectionId: section.id, insertIndex })}
                    onDeleteRow={(rowId) => deleteRow(section.id, rowId)}
                    onDuplicateRow={(rowId) => duplicateRow(section.id, rowId)}
                    onMoveRow={moveRow}
                    onMoveRowUp={moveRowUp}
                    onMoveRowDown={moveRowDown}
                    onMoveElement={moveElement}
                    onMoveElementUp={moveElementUp}
                    onMoveElementDown={moveElementDown}
                    onMoveSection={moveSection}
                    onMoveSectionUp={() => moveSectionUp(section.id)}
                    onMoveSectionDown={() => moveSectionDown(section.id)}
                    onMoveColumn={moveColumn}
                    onAddColumn={addColumn}
                    onDuplicateColumn={(columnId) => {
                      // Find the row that contains this column
                      const foundRow = section.rows?.find(row => 
                        row.columns.some(col => col.id === columnId)
                      );
                      if (foundRow) {
                        duplicateColumn(section.id, foundRow.id, columnId);
                      }
                    }}
                    onDeleteColumn={(columnId) => {
                      // Find the row that contains this column
                      const foundRow = section.rows?.find(row => 
                        row.columns.some(col => col.id === columnId)
                      );
                      if (foundRow) {
                        setDeleteColumnDialog({
                          sectionId: section.id,
                          rowId: foundRow.id,
                          columnId
                        });
                      }
                    }}
                    onAddElement={addElement}
                    onUpdateElement={updateElement}
                    onDeleteElement={deleteElement}
                    onDuplicateElement={duplicateElement}
                    selection={selection}
                    onSelectionChange={setSelection}
                    onAddSectionAfter={() => addSectionAfter(sectionIndex)}
                  />
                  
                  {/* Section drop zone after each section */}
                  <SectionDropZone 
                    insertIndex={sectionIndex + 1} 
                    onMoveSection={moveSection}
                  />
                </div>
              ))}
              
              {/* Add Section button at end */}
              <div className="pt-4 text-center">
                <Button variant="outline" onClick={() => addSection()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
};
