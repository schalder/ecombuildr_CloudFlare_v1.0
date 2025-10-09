import { useState, useCallback } from 'react';
import { PageBuilderData, PageBuilderElement, PageBuilderSection, PageBuilderRow } from '../types';
import { cleanupAllCustomCSS } from '../utils/customCSSManager';
import { runMigrationIfNeeded } from '../utils/elementMigration';

interface HistoryState {
  past: PageBuilderData[];
  present: PageBuilderData;
  future: PageBuilderData[];
}

export const usePageBuilderState = (initialData?: PageBuilderData) => {
  const defaultData: PageBuilderData = {
    sections: []
  };

  // Run migration on initial data if needed
  const migratedInitialData = initialData ? runMigrationIfNeeded(initialData) : defaultData;

  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: migratedInitialData,
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

  const addElement = useCallback((elementType: string, targetPath: string, insertIndex?: number) => {
    const [sectionId, rowId, columnId] = targetPath.split('.');
    
    
    
    const newElement: PageBuilderElement = {
      id: generateId(),
      type: elementType,
      content: getDefaultContent(elementType),
      // Add default center alignment for text-based elements and default green button styling
      ...(elementType === 'heading' || elementType === 'text' ? {
        styles: { textAlign: 'center' }
      } : elementType === 'button' ? {
        styles: { 
          textAlign: 'center',
          backgroundColor: 'hsl(142 76% 36%)',
          color: 'hsl(0 0% 98%)',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '16px',
          padding: '14px 28px',
          borderWidth: '0px',
          boxShadow: '0 4px 12px hsl(142 76% 36% / 0.3)'
        }
      } : {})
    };

    

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
                    const elements = [...column.elements];
                    const index = insertIndex !== undefined ? insertIndex : elements.length;
                    elements.splice(index, 0, newElement);
                    
                    const updatedColumn = {
                      ...column,
                      elements
                    };
                    
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

    
    recordHistory(newData);
  }, [pageData, recordHistory]);

  const moveElement = useCallback((elementId: string, targetPath: string, insertIndex: number) => {
    const [targetSectionId, targetRowId, targetColumnId] = targetPath.split('.');
    
    
    
    // Find and remove the element from its current location
    let elementToMove: PageBuilderElement | null = null;
    
    const newSections = pageData.sections.map(section => ({
      ...section,
      rows: section.rows.map(row => ({
        ...row,
        columns: row.columns.map(column => ({
          ...column,
          elements: column.elements.filter(element => {
            if (element.id === elementId) {
              elementToMove = element;
              return false;
            }
            return true;
          })
        }))
      }))
    }));

    if (!elementToMove) {
      console.error('Element not found:', elementId);
      return;
    }

    // Add the element to its new location
    const finalSections = newSections.map(section => {
      if (section.id === targetSectionId) {
        return {
          ...section,
          rows: section.rows.map(row => {
            if (row.id === targetRowId) {
              return {
                ...row,
                columns: row.columns.map(column => {
                  if (column.id === targetColumnId) {
                    const elements = [...column.elements];
                    elements.splice(insertIndex, 0, elementToMove!);
                    
                    
                    return {
                      ...column,
                      elements
                    };
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
      sections: finalSections
    };

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

  const moveRow = useCallback((rowId: string, targetSectionId: string, insertIndex: number) => {
    
    
    // Find and remove the row from its current location
    let rowToMove: PageBuilderRow | null = null;
    let sourceSectionId: string | null = null;
    
    const newSections = pageData.sections.map(section => {
      const updatedRows = section.rows.filter(row => {
        if (row.id === rowId) {
          rowToMove = row;
          sourceSectionId = section.id;
          return false;
        }
        return true;
      });
      
      return {
        ...section,
        rows: updatedRows
      };
    });

    if (!rowToMove || !sourceSectionId) {
      console.error('Row not found:', rowId);
      return;
    }

    // Add the row to its new location
    const finalSections = newSections.map(section => {
      if (section.id === targetSectionId) {
        const rows = [...section.rows];
        rows.splice(insertIndex, 0, rowToMove!);
        
        
        return {
          ...section,
          rows
        };
      }
      return section;
    });

    const newData: PageBuilderData = {
      ...pageData,
      sections: finalSections
    };

    recordHistory(newData);
  }, [pageData, recordHistory]);

  const moveSection = useCallback((sectionId: string, insertIndex: number) => {
    
    
    // Find and remove the section from its current location
    let sectionToMove: PageBuilderSection | null = null;
    const currentIndex = pageData.sections.findIndex(section => section.id === sectionId);
    
    if (currentIndex === -1) {
      console.error('Section not found:', sectionId);
      return;
    }
    
    sectionToMove = pageData.sections[currentIndex];
    const sectionsWithoutMoved = pageData.sections.filter(section => section.id !== sectionId);
    
    // Adjust insert index if moving within the same array
    const finalInsertIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
    
    // Insert at new position
    const finalSections = [...sectionsWithoutMoved];
    finalSections.splice(finalInsertIndex, 0, sectionToMove);
    
    

    const newData: PageBuilderData = {
      ...pageData,
      sections: finalSections
    };

    recordHistory(newData);
  }, [pageData, recordHistory]);

  const updatePageData = useCallback((newData: PageBuilderData) => {
    recordHistory(newData);
  }, [recordHistory]);

  const setPreviewMode = useCallback((preview: boolean) => {
    setIsPreviewMode(preview);
    if (preview) {
      setSelectedElement(undefined);
      // Clean up all custom CSS when switching to preview mode
      cleanupAllCustomCSS();
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
    moveElement,
    moveRow,
    moveSection,
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
      return { text: 'Large Call to Action Headline', level: 1 };
    case 'heading-h2':
      return { text: 'Large Call to Action Headline', level: 2 };
    case 'heading-h3':
      return { text: 'Large Call to Action Headline', level: 3 };
    case 'text':
    case 'paragraph':
      return { text: 'Your Paragraph text goes Lorem ipsum dolor sit amet, consectetur adipisicing elit. Autem dolore, alias, numquam enim ab voluptate id quam harum ducimus cupiditate similique quisquam et deserunt, recusandae. here' };
    case 'button':
      return { 
        text: 'Get Started', 
        variant: 'default', 
        size: 'default', 
        url: '#' 
      };
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