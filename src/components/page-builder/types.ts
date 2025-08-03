// Hierarchical page builder types: Section → Row → Column → Element

export interface PageBuilderElement {
  id: string;
  type: string;
  content: Record<string, any>;
  styles?: {
    margin?: string;
    padding?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: string;
    color?: string;
    backgroundColor?: string;
  };
}

export interface PageBuilderColumn {
  id: string;
  width: number; // 1-12 based on grid system
  elements: PageBuilderElement[];
  styles?: {
    padding?: string;
    backgroundColor?: string;
  };
}

export interface PageBuilderRow {
  id: string;
  columns: PageBuilderColumn[];
  columnLayout: '1' | '1-1' | '1-2' | '2-1' | '1-1-1' | '1-2-1' | '2-1-1' | '1-1-1-1' | '1-1-1-1-1' | '1-1-1-1-1-1';
  styles?: {
    padding?: string;
    margin?: string;
    backgroundColor?: string;
  };
}

export interface PageBuilderSection {
  id: string;
  rows: PageBuilderRow[];
  width: 'full' | 'wide' | 'medium' | 'small';
  styles?: {
    padding?: string;
    margin?: string;
    backgroundColor?: string;
    backgroundImage?: string;
  };
}

export interface PageBuilderData {
  sections: PageBuilderSection[];
  globalStyles?: {
    fontFamily?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

// Element types for the element library
export interface ElementType {
  id: string;
  name: string;
  category: 'basic' | 'media' | 'ecommerce' | 'marketing' | 'form' | 'custom';
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<{ element: PageBuilderElement; isEditing?: boolean; onUpdate?: (updates: Partial<PageBuilderElement>) => void; }>;
  defaultContent: Record<string, any>;
  description?: string;
}

// Drag and drop types
export interface DragItem {
  type: 'element-type' | 'element' | 'section' | 'row';
  elementType?: string;
  elementId?: string;
  sectionId?: string;
  rowId?: string;
  columnId?: string;
}

export interface DropZone {
  type: 'section' | 'row' | 'column';
  targetId: string;
  position: 'before' | 'after' | 'inside';
}

// Column layout configurations
export const COLUMN_LAYOUTS = {
  '1': [12],
  '1-1': [6, 6],
  '1-2': [4, 8],
  '2-1': [8, 4],
  '1-1-1': [4, 4, 4],
  '1-2-1': [3, 6, 3],
  '2-1-1': [6, 3, 3],
  '1-1-1-1': [3, 3, 3, 3],
  '1-1-1-1-1': [2, 2, 2, 3, 3],
  '1-1-1-1-1-1': [2, 2, 2, 2, 2, 2]
} as const;

// Section width configurations
export const SECTION_WIDTHS = {
  full: '100%',
  wide: '1200px',
  medium: '800px',
  small: '600px'
} as const;