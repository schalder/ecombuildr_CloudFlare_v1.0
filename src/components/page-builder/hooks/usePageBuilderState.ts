import { useState, useCallback, useMemo } from 'react';
import { PageBuilderData, PageBuilderElement, PageBuilderSection, PageBuilderRow, PageBuilderColumn, COLUMN_LAYOUTS } from '../types';

interface HistoryState {
  past: PageBuilderData[];
  present: PageBuilderData;
  future: PageBuilderData[];
}

export const usePageBuilderState = (initialData?: PageBuilderData) => {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialData || { sections: [], globalStyles: {} },
    future: []
  });

  const [selectedElement, setSelectedElement] = useState<PageBuilderElement | undefined>();
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const pageData = history.present;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const recordHistory = useCallback((newData: PageBuilderData) => {
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: newData,
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

  const generateId = () => `id_${Math.random().toString(36).substr(2, 9)}`;

  const selectElement = useCallback((element: PageBuilderElement | undefined) => {
    setSelectedElement(element);
  }, []);

  const updateElement = useCallback((elementId: string, updates: Partial<PageBuilderElement>) => {
    const updateElementRecursive = (sections: PageBuilderSection[]): PageBuilderSection[] => {
      return sections.map(section => {
        if (section.id === elementId) {
          return { ...section, ...updates } as PageBuilderSection;
        }

        return {
          ...section,
          rows: section.rows.map(row => {
            if (row.id === elementId) {
              return { ...row, ...updates } as PageBuilderRow;
            }

            return {
              ...row,
              columns: row.columns.map(column => {
                if (column.id === elementId) {
                  return { ...column, ...updates } as PageBuilderColumn;
                }

                return {
                  ...column,
                  elements: column.elements.map(element => 
                    element.id === elementId 
                      ? { ...element, ...updates }
                      : element
                  )
                };
              })
            };
          })
        };
      });
    };

    const newData = {
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
    const newData = { ...pageData };
    
    if (elementType === 'section') {
      // Add new section
      const newSection: PageBuilderSection = {
        id: generateId(),
        rows: [{
          id: generateId(),
          columns: [{
            id: generateId(),
            width: 12,
            elements: []
          }],
          columnLayout: '1'
        }],
        width: 'wide'
      };
      newData.sections.push(newSection);
    } else if (elementType === 'row') {
      // Add row to section
      const sectionId = targetPath.replace('section-', '');
      const section = newData.sections.find(s => s.id === sectionId);
      if (section) {
        const newRow: PageBuilderRow = {
          id: generateId(),
          columns: [{
            id: generateId(),
            width: 12,
            elements: []
          }],
          columnLayout: '1'
        };
        section.rows.push(newRow);
      }
    } else {
      // Add element to first available column
      if (newData.sections.length === 0) {
        // Create a section first
        const newSection: PageBuilderSection = {
          id: generateId(),
          rows: [{
            id: generateId(),
            columns: [{
              id: generateId(),
              width: 12,
              elements: []
            }],
            columnLayout: '1'
          }],
          width: 'wide'
        };
        newData.sections.push(newSection);
      }
      
      const targetSection = newData.sections[0];
      if (targetSection.rows.length === 0) {
        const newRow: PageBuilderRow = {
          id: generateId(),
          columns: [{
            id: generateId(),
            width: 12,
            elements: []
          }],
          columnLayout: '1'
        };
        targetSection.rows.push(newRow);
      }
      
      const targetColumn = targetSection.rows[0].columns[0];
      const newElement: PageBuilderElement = {
        id: generateId(),
        type: elementType,
        content: getDefaultContent(elementType),
        styles: {}
      };
      targetColumn.elements.push(newElement);
    }
    
    recordHistory(newData);
  }, [pageData, recordHistory]);

  const removeElement = useCallback((elementId: string) => {
    const removeElementRecursive = (sections: PageBuilderSection[]): PageBuilderSection[] => {
      return sections.filter(section => {
        if (section.id === elementId) return false;

        section.rows = section.rows.filter(row => {
          if (row.id === elementId) return false;

          row.columns = row.columns.filter(column => {
            if (column.id === elementId) return false;

            column.elements = column.elements.filter(element => element.id !== elementId);
            return true;
          });
          return true;
        });
        return true;
      });
    };

    const newData = {
      ...pageData,
      sections: removeElementRecursive(pageData.sections)
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