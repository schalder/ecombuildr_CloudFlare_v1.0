import { useCallback } from 'react';
import { PageBuilderData, PageBuilderSection, PageBuilderRow, PageBuilderColumn, PageBuilderElement } from '../types';

export const usePageBuilderStyleUpdates = (
  pageData: PageBuilderData,
  updatePageData: (newData: PageBuilderData) => void
) => {
  
  // Update section styles
  const updateSection = useCallback((sectionId: string, updates: Partial<PageBuilderSection>) => {
    
    
    const newData: PageBuilderData = {
      ...pageData,
      sections: pageData.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            ...updates,
            styles: {
              ...section.styles,
              ...updates.styles
            }
          };
        }
        return section;
      })
    };
    
    
    updatePageData(newData);
  }, [pageData, updatePageData]);

  // Update row styles
  const updateRow = useCallback((sectionId: string, rowId: string, updates: Partial<PageBuilderRow>) => {
    
    
    const newData: PageBuilderData = {
      ...pageData,
      sections: pageData.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            rows: section.rows.map(row => {
              if (row.id === rowId) {
                return {
                  ...row,
                  ...updates,
                  styles: {
                    ...row.styles,
                    ...updates.styles
                  }
                };
              }
              return row;
            })
          };
        }
        return section;
      })
    };
    
    
    updatePageData(newData);
  }, [pageData, updatePageData]);

  // Update column styles
  const updateColumn = useCallback((sectionId: string, rowId: string, columnId: string, updates: Partial<PageBuilderColumn>) => {
    
    
    const newData: PageBuilderData = {
      ...pageData,
      sections: pageData.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            rows: section.rows.map(row => {
              if (row.id === rowId) {
                return {
                  ...row,
                  columns: row.columns.map(column => {
                    if (column.id === columnId) {
                      return {
                        ...column,
                        ...updates,
                        styles: {
                          ...column.styles,
                          ...updates.styles
                        }
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
      })
    };
    
    
    updatePageData(newData);
  }, [pageData, updatePageData]);

  // Update element styles
  const updateElement = useCallback((elementId: string, updates: Partial<PageBuilderElement>) => {
    
    
    const newData: PageBuilderData = {
      ...pageData,
      sections: pageData.sections.map(section => ({
        ...section,
        rows: section.rows.map(row => ({
          ...row,
          columns: row.columns.map(column => ({
            ...column,
            elements: column.elements.map(element => 
              element.id === elementId 
                ? { 
                    ...element, 
                    ...updates,
                    styles: {
                      ...element.styles,
                      ...updates.styles
                    }
                  }
                : element
            )
          }))
        }))
      }))
    };
    
    
    updatePageData(newData);
  }, [pageData, updatePageData]);

  return {
    updateSection,
    updateRow,
    updateColumn,
    updateElement
  };
};