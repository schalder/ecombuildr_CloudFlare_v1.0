// Hierarchical page builder types: Section → Row → Column → Element

// Background image modes
export type BackgroundImageMode = 'full-center' | 'parallax' | 'fill-width' | 'no-repeat' | 'repeat';

// Form Builder Types
export interface FormField {
  id: string;
  type: 'fullName' | 'firstName' | 'lastName' | 'email' | 'phone' | 'address' | 'singleLineText' | 'textBox';
  label: string;
  placeholder?: string;
  required: boolean;
}

export interface FormContent {
  formName: string;
  fields: FormField[];
  buttonText: string;
  submitAction: 'step' | 'url';
  redirectUrl?: string;
  redirectStepId?: string;
  successMessage: string;
}

export interface FormStyles {
  typography: {
    labelFont: ResponsiveStyle;
    placeholderFont: ResponsiveStyle;
    buttonFont: ResponsiveStyle;
  };
  colors: {
    fieldBorder: string;
    formLabel: string;
    placeholder: string;
    inputText: string;
    buttonBg: string;
    buttonText: string;
    buttonHoverBg: string;
    buttonHoverText: string;
    formBackground: string;
  };
  layout: {
    formWidth: ResponsiveValue;
    fieldGap: ResponsiveValue;
    labelAlignment: ResponsiveValue;
    borderWidth: string;
    borderColor: string;
    borderRadius: string;
  };
}

export interface PageBuilderElement {
  id: string;
  anchor?: string;
  type: string;
  content: {
    text?: string;
    url?: string;
    alt?: string;
    src?: string;
    width?: number;
    height?: number;
    caption?: string;
    uploadMethod?: 'upload' | 'url';
    alignment?: 'left' | 'right' | 'center' | 'full';
    linkUrl?: string;
    linkTarget?: '_blank' | '_self';
    [key: string]: any;
  };
  styles?: {
    margin?: string;
    padding?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: string;
    lineHeight?: string;
    color?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    boxShadow?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    width?: string;
    height?: string;
    maxWidth?: string;
    minWidth?: string;
    maxHeight?: string;
    minHeight?: string;
    borderWidth?: string;
    borderColor?: string;
    borderRadius?: string;
    borderStyle?: string;
    opacity?: number;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    fontWeight?: string;
    fontFamily?: string;
    // Social Links Element specific properties
    containerAlignment?: 'left' | 'center' | 'right';
    titleFontSize?: string;
    titleFontWeight?: string;
    titleColor?: string;
    titleMarginBottom?: string;
    buttonLayout?: 'horizontal' | 'vertical';
    buttonSpacing?: string;
    buttonBorderRadius?: string;
    buttonBackgroundColor?: string;
    buttonTextColor?: string;
    buttonBorderWidth?: string;
    buttonBorderColor?: string;
    responsive?: {
      desktop?: Record<string, any>;
      tablet?: Record<string, any>;
      mobile?: Record<string, any>;
    };
  };
}

export interface PageBuilderColumn {
  id: string;
  anchor?: string;
  width: number; // 1-12 based on grid system
  elements: PageBuilderElement[];
  customWidth?: string; // Custom width override (px, %, vw, etc.)
  styles?: {
    padding?: string;
    margin?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundImageMode?: BackgroundImageMode;
    backgroundGradient?: string;
    backgroundOpacity?: number;
    boxShadow?: string;
    borderWidth?: string;
    borderColor?: string;
    borderRadius?: string;
    borderStyle?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    width?: string; // Custom width override
    maxWidth?: string;
    minWidth?: string;
    // Content alignment properties
    contentAlignment?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
    contentJustification?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
    contentDirection?: 'column' | 'row';
    contentGap?: string;
    responsive?: {
      desktop?: Record<string, any>;
      tablet?: Record<string, any>;
      mobile?: Record<string, any>;
    };
  };
  responsive?: {
    mobile?: {
      width?: number;
      hidden?: boolean;
      customWidth?: string;
    };
    tablet?: {
      width?: number;
      hidden?: boolean;
      customWidth?: string;
    };
    desktop?: {
      width?: number;
      hidden?: boolean;
      customWidth?: string;
    };
  };
}

export interface PageBuilderRow {
  id: string;
  anchor?: string;
  columns: PageBuilderColumn[];
  columnLayout: '1' | '1-1' | '1-2' | '2-1' | '1-1-1' | '1-2-1' | '2-1-1' | '1-1-1-1' | '1-1-1-1-1' | '1-1-1-1-1-1';
  customWidth?: string; // Custom width override (px, %, vw, etc.)
  styles?: {
    padding?: string;
    margin?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundImageMode?: BackgroundImageMode;
    backgroundGradient?: string;
    backgroundOpacity?: number;
    boxShadow?: string;
    borderWidth?: string;
    borderColor?: string;
    borderRadius?: string;
    borderStyle?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    width?: string; // Custom width override
    maxWidth?: string;
    minWidth?: string;
    responsive?: {
      desktop?: Record<string, any>;
      tablet?: Record<string, any>;
      mobile?: Record<string, any>;
    };
  };
  responsive?: {
    mobile?: {
      stackColumns?: boolean;
      columnGap?: string;
      customWidth?: string;
    };
    tablet?: {
      columnLayout?: string;
      columnGap?: string;
      customWidth?: string;
    };
    desktop?: {
      columnGap?: string;
      customWidth?: string;
    };
  };
}

export interface PageBuilderSection {
  id: string;
  anchor?: string;
  rows: PageBuilderRow[];
  width: 'full' | 'wide' | 'medium' | 'small';
  customWidth?: string; // Custom width override (px, %, vw, etc.)
  styles?: {
    padding?: string;
    margin?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundImageMode?: BackgroundImageMode;
    backgroundGradient?: string;
    backgroundOpacity?: number;
    boxShadow?: string;
    borderWidth?: string;
    borderColor?: string;
    borderRadius?: string;
    borderStyle?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    width?: string; // Custom width override
    maxWidth?: string;
    minWidth?: string;
    height?: string;
    minHeight?: string;
    maxHeight?: string;
    contentVerticalAlignment?: 'top' | 'center' | 'bottom';
    stickyPosition?: 'none' | 'top' | 'bottom';
    stickyOffset?: string; // Offset from edge (e.g., "0px", "20px")
    responsive?: {
      desktop?: Record<string, any>;
      tablet?: Record<string, any>;
      mobile?: Record<string, any>;
    };
  };
}

export interface PageBuilderData {
  sections: PageBuilderSection[];
  globalStyles?: {
    fontFamily?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  pageStyles?: {
    backgroundType?: 'none' | 'color' | 'image';
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundSize?: 'cover' | 'contain' | 'auto';
    backgroundPosition?: string;
    backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
  };
}

// Element types for the element library
export interface ElementType {
  id: string;
  name: string;
  category: 'basic' | 'media' | 'ecommerce' | 'marketing' | 'form' | 'custom';
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<{ element: PageBuilderElement; isEditing?: boolean; deviceType?: 'desktop' | 'tablet' | 'mobile'; columnCount?: number; onUpdate?: (updates: Partial<PageBuilderElement>) => void; }>;
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

// Responsive layout configurations for mobile-first approach
export const RESPONSIVE_LAYOUTS = {
  '1': 'grid-cols-1',
  '1-1': 'grid-cols-1 md:grid-cols-2',
  '1-2': 'grid-cols-1 md:grid-cols-3 [&>:first-child]:md:col-span-1 [&>:last-child]:md:col-span-2',
  '2-1': 'grid-cols-1 md:grid-cols-3 [&>:first-child]:md:col-span-2 [&>:last-child]:md:col-span-1',
  '1-1-1': 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
  '1-2-1': 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 [&>:first-child]:md:col-span-1 [&>:nth-child(2)]:md:col-span-2 [&>:last-child]:md:col-span-1',
  '2-1-1': 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 [&>:first-child]:md:col-span-2 [&>:nth-child(2)]:md:col-span-1 [&>:last-child]:md:col-span-1',
  '1-1-1-1': 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4',
  '1-1-1-1-1': 'grid-cols-1 sm:grid-cols-2 md:grid-cols-5',
  '1-1-1-1-1-1': 'grid-cols-1 sm:grid-cols-2 md:grid-cols-6'
} as const;

// Section width configurations
export const SECTION_WIDTHS = {
  full: '100%',
  wide: '1200px',
  medium: '800px',
  small: '600px'
} as const;