import { PageBuilderData, PageBuilderElement, PageBuilderSection, PageBuilderRow, PageBuilderColumn, ElementVisibility } from '../types';

/**
 * Default visibility settings for all elements
 */
const DEFAULT_VISIBILITY: ElementVisibility = {
  desktop: true,
  tablet: true,
  mobile: true
};

/**
 * Migrate a single element to include default visibility settings
 */
export const migrateElement = (element: PageBuilderElement): PageBuilderElement => {
  return {
    ...element,
    visibility: element.visibility || DEFAULT_VISIBILITY
  };
};

/**
 * Migrate a single column to include default visibility settings
 */
export const migrateColumn = (column: PageBuilderColumn): PageBuilderColumn => {
  return {
    ...column,
    visibility: column.visibility || DEFAULT_VISIBILITY,
    elements: column.elements.map(migrateElement)
  };
};

/**
 * Migrate a single row to include default visibility settings
 */
export const migrateRow = (row: PageBuilderRow): PageBuilderRow => {
  return {
    ...row,
    visibility: row.visibility || DEFAULT_VISIBILITY,
    columns: row.columns.map(migrateColumn)
  };
};

/**
 * Migrate a single section to include default visibility settings
 */
export const migrateSection = (section: PageBuilderSection): PageBuilderSection => {
  return {
    ...section,
    visibility: section.visibility || DEFAULT_VISIBILITY,
    rows: section.rows.map(migrateRow)
  };
};

/**
 * Migrate page builder data to include default visibility settings for all elements
 * This ensures backward compatibility with existing pages
 */
export const migratePageBuilderData = (pageData: PageBuilderData): PageBuilderData => {
  return {
    ...pageData,
    sections: pageData.sections.map(migrateSection)
  };
};

/**
 * Check if page data needs migration (has elements without visibility settings)
 */
export const needsMigration = (pageData: PageBuilderData): boolean => {
  const checkElement = (element: PageBuilderElement): boolean => {
    return !element.visibility;
  };

  const checkColumn = (column: PageBuilderColumn): boolean => {
    return !column.visibility || column.elements.some(checkElement);
  };

  const checkRow = (row: PageBuilderRow): boolean => {
    return !row.visibility || row.columns.some(checkColumn);
  };

  const checkSection = (section: PageBuilderSection): boolean => {
    return !section.visibility || section.rows.some(checkRow);
  };

  return pageData.sections.some(checkSection);
};

/**
 * Run migration on page data if needed
 * This should be called when loading page data to ensure backward compatibility
 */
export const runMigrationIfNeeded = (pageData: PageBuilderData): PageBuilderData => {
  if (needsMigration(pageData)) {
    console.log('[ElementMigration] Running visibility migration for page data');
    return migratePageBuilderData(pageData);
  }
  return pageData;
};
