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
    const newSections = [...pageData.sections];

    if (elementType === 'section' || targetPath === 'root') {
      // Add new section
      const newSection: PageBuilderSection = {
        id: generateId(),
        rows: [],
        width: 'wide',
        styles: {}
      };
      newSections.push(newSection);
    } else if (elementType === 'row' || targetPath.startsWith('section-')) {
      // Add row to section
      const sectionId = targetPath.replace('section-', '');
      const sectionIndex = newSections.findIndex(s => s.id === sectionId);
      
      if (sectionIndex !== -1) {
        const newRow: PageBuilderRow = {
          id: generateId(),
          columns: [
            {
              id: generateId(),
              width: 12,
              elements: [],
              styles: {}
            }
          ],
          columnLayout: '1',
          styles: {}
        };
        newSections[sectionIndex].rows.push(newRow);
      }
    } else if (targetPath.startsWith('column-')) {
      // Add element to column
      const columnId = targetPath.replace('column-', '');
      
      const newElement: PageBuilderElement = {
        id: generateId(),
        type: elementType,
        content: getDefaultContent(elementType),
        styles: {}
      };

      // Find and update the column
      for (let section of newSections) {
        for (let row of section.rows) {
          const columnIndex = row.columns.findIndex(c => c.id === columnId);
          if (columnIndex !== -1) {
            row.columns[columnIndex].elements.push(newElement);
            break;
          }
        }
      }
    }

    const newData = { ...pageData, sections: newSections };
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
      return { text: 'Your Heading Here', tag: 'h2' };
    case 'text':
      return { text: 'Add your text content here. You can edit this text by selecting the element.' };
    case 'button':
      return { text: 'Click Here', href: '#' };
    case 'image':
      return { src: 'https://via.placeholder.com/400x300', alt: 'Placeholder image' };
    case 'video':
      return { src: '', poster: 'https://via.placeholder.com/400x300' };
    default:
      return {};
  }
}