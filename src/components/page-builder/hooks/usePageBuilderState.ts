import { useState, useCallback } from 'react';
import { PageBuilderData, PageBuilderElement, PageBuilderSection, PageBuilderRow } from '../types';

interface HistoryState {
  past: PageBuilderData[];
  present: PageBuilderData;
  future: PageBuilderData[];
}

export const usePageBuilderState = (initialData?: PageBuilderData) => {
  const defaultData: PageBuilderData = {
    sections: []
  };

  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialData || defaultData,
    future: []
  });

  const [selectedElement, setSelectedElement] = useState<PageBuilderElement | undefined>();
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const pageData = history.present;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const generateId = () => `pb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const recordHistory = useCallback((newData: PageBuilderData) => {
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: structuredClone(newData), // Deep clone to prevent circular references
      future: []
    }));
  }, []);

  const undo = useCallback(() => {
    if (canUndo) {
      setHistory(prev => ({
        past: prev.past.slice(0, -1),
        present: prev.past[prev.past.length - 1],
        future: [prev.present, ...prev.future]
      }));
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setHistory(prev => ({
        past: [...prev.past, prev.present],
        present: prev.future[0],
        future: prev.future.slice(1)
      }));
    }
  }, [canRedo]);

  const selectElement = useCallback((element: PageBuilderElement | undefined) => {
    setSelectedElement(element);
  }, []);

  const updateElement = useCallback((elementId: string, updates: Partial<PageBuilderElement>) => {
    const updateElementRecursive = (sections: PageBuilderSection[]): PageBuilderSection[] => {
      return sections.map(section => ({
        ...section,
        rows: section.rows.map(row => ({
          ...row,
          columns: row.columns.map(column => ({
            ...column,
            elements: column.elements.map(element => 
              element.id === elementId 
                ? { ...element, ...updates }
                : element
            )
          }))
        }))
      }));
    };

    const newData: PageBuilderData = {
      ...pageData,
      sections: updateElementRecursive(pageData.sections)
    };

    recordHistory(newData);

    // Update selected element if it's the one being updated
    if (selectedElement?.id === elementId) {
      setSelectedElement({ ...selectedElement, ...updates });
    }
  }, [pageData, selectedElement, recordHistory]);

  const addElement = useCallback((elementType: string, targetPath: string) => {
    const [sectionId, rowId, columnId] = targetPath.split('.');
    
    console.log('Adding element:', { sectionId, rowId, columnId, elementType });
    
    const newElement: PageBuilderElement = {
      id: generateId(),
      type: elementType,
      content: getDefaultContent(elementType)
    };

    console.log('New element created:', newElement);

    // Create a deep clone to avoid circular references
    const newSections = pageData.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          rows: section.rows.map(row => {
            if (row.id === rowId) {
              return {
                ...row,
                columns: row.columns.map(column => {
                  if (column.id === columnId) {
                    const updatedColumn = {
                      ...column,
                      elements: [...column.elements, newElement]
                    };
                    console.log(`Added element to column ${columnId}. New element count:`, updatedColumn.elements.length);
                    return updatedColumn;
                  }
                  return column;
                })
              };
            }
            return row;
          })
        };
      }
      return section;
    });

    const newData: PageBuilderData = {
      ...pageData,
      sections: newSections
    };

    // Validate the data structure
    const elementCount = newData.sections.reduce((total, section) => {
      return total + section.rows.reduce((rowTotal, row) => {
        return rowTotal + row.columns.reduce((colTotal, col) => {
          return colTotal + col.elements.length;
        }, 0);
      }, 0);
    }, 0);

    console.log(`Total elements in page: ${elementCount}`);
    recordHistory(newData);
  }, [pageData, recordHistory]);

  const removeElement = useCallback((elementId: string) => {
    const newSections = pageData.sections.map(section => ({
      ...section,
      rows: section.rows.map(row => ({
        ...row,
        columns: row.columns.map(column => ({
          ...column,
          elements: column.elements.filter(element => element.id !== elementId)
        }))
      }))
    }));

    const newData: PageBuilderData = {
      ...pageData,
      sections: newSections
    };

    recordHistory(newData);

    // Clear selection if the removed element was selected
    if (selectedElement?.id === elementId) {
      setSelectedElement(undefined);
    }
  }, [pageData, selectedElement, recordHistory]);

  const updatePageData = useCallback((newData: PageBuilderData) => {
    recordHistory(newData);
  }, [recordHistory]);

  const setPreviewMode = useCallback((preview: boolean) => {
    setIsPreviewMode(preview);
    if (preview) {
      setSelectedElement(undefined);
    }
  }, []);

  return {
    pageData,
    selectedElement,
    deviceType,
    isPreviewMode,
    canUndo,
    canRedo,
    selectElement,
    updateElement,
    addElement,
    removeElement,
    setDeviceType,
    setPreviewMode,
    undo,
    redo,
    updatePageData
  };
};

function getDefaultContent(elementType: string): Record<string, any> {
  switch (elementType) {
    case 'heading':
    case 'heading-h1':
      return { text: 'Your heading text', level: 1 };
    case 'heading-h2':
      return { text: 'Your heading text', level: 2 };
    case 'heading-h3':
      return { text: 'Your heading text', level: 3 };
    case 'text':
    case 'paragraph':
      return { text: 'Your text content goes here...' };
    case 'button':
      return { text: 'Click Me', variant: 'default', size: 'default', url: '#' };
    case 'image':
      return { src: '', alt: 'Image', width: '100%', height: 'auto' };
    case 'video':
      return { src: '', autoplay: false, controls: true };
    case 'spacer':
      return { height: '50px' };
    case 'divider':
      return { style: 'solid', width: '100%', color: '#e5e7eb' };
    case 'list':
      return { items: ['Item 1', 'Item 2', 'Item 3'], ordered: false };
    default:
      return {};
  }
}