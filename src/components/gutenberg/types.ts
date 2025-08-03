import { ReactNode } from 'react';

// Core block types for Gutenberg editor
export interface GutenbergBlock {
  id: string;
  type: string;
  content: Record<string, any>;
  attributes?: Record<string, any>;
  innerBlocks?: GutenbergBlock[];
  parentId?: string;
}

// Block registration for Gutenberg
export interface GutenbergBlockType {
  name: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'text' | 'media' | 'design' | 'widgets' | 'theme' | 'commerce';
  description?: string;
  keywords?: string[];
  supports?: {
    align?: boolean;
    anchor?: boolean;
    className?: boolean;
    color?: boolean;
    customClassName?: boolean;
    fontSize?: boolean;
    html?: boolean;
    inserter?: boolean;
    multiple?: boolean;
    reusable?: boolean;
    spacing?: boolean;
    typography?: boolean;
  };
  parent?: string[];
  providesContext?: Record<string, string>;
  usesContext?: string[];
}

export interface GutenbergBlockRegistration {
  name: string;
  settings: GutenbergBlockType;
  edit: React.ComponentType<GutenbergBlockEditProps>;
  save: React.ComponentType<GutenbergBlockSaveProps>;
  transforms?: {
    from?: Array<{
      type: string;
      blocks: string[];
      transform: (attributes: any) => GutenbergBlock;
    }>;
    to?: Array<{
      type: string;
      blocks: string[];
      transform: (attributes: any) => GutenbergBlock;
    }>;
  };
  variations?: Array<{
    name: string;
    title: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
    attributes?: Record<string, any>;
    innerBlocks?: Array<[string, Record<string, any>]>;
    example?: Record<string, any>;
    scope?: Array<'block' | 'inserter' | 'transform'>;
    isDefault?: boolean;
  }>;
}

export interface GutenbergBlockEditProps {
  block: GutenbergBlock;
  onUpdate: (updates: Partial<GutenbergBlock['content']>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSelectNext: () => void;
  onSelectPrevious: () => void;
  isSelected: boolean;
  isMultiSelected?: boolean;
  onSelect: () => void;
  onFocus: () => void;
  onBlur: () => void;
  insertBlocksAfter?: (blocks: GutenbergBlock[]) => void;
  insertBlocksBefore?: (blocks: GutenbergBlock[]) => void;
  replaceBlock?: (block: GutenbergBlock) => void;
  mergeBlocks?: (forward: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
  clientId: string;
  name: string;
  attributes: Record<string, any>;
  setAttributes: (attributes: Record<string, any>) => void;
  context?: Record<string, any>;
}

export interface GutenbergBlockSaveProps {
  block: GutenbergBlock;
  attributes: Record<string, any>;
  innerBlocks?: ReactNode;
  className?: string;
}

// Editor state and actions
export interface EditorState {
  blocks: GutenbergBlock[];
  selectedBlockIds: string[];
  multiSelectedBlockIds: string[];
  focusedBlockId: string | null;
  insertionPoint: {
    index: number;
    rootClientId?: string;
  } | null;
  isDragging: boolean;
  isInserterOpen: boolean;
  inserterSearchTerm: string;
  preferences: {
    fixedToolbar: boolean;
    welcomeGuide: boolean;
    fullscreenMode: boolean;
    distractionFree: boolean;
    keepCaretInsideBlock: boolean;
    showBlockBreadcrumbs: boolean;
    showListViewOutline: boolean;
  };
  editedPostContent: string;
  editedPostId: string | null;
  isPreviewMode: boolean;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  zoom: number;
}

export interface EditorSettings {
  alignWide: boolean;
  allowedBlockTypes: string[] | boolean;
  bodyPlaceholder: string;
  canLockBlocks: boolean;
  codeEditingEnabled: boolean;
  colors: Array<{
    name: string;
    slug: string;
    color: string;
  }>;
  fontSizes: Array<{
    name: string;
    slug: string;
    size: string;
  }>;
  gradients: Array<{
    name: string;
    slug: string;
    gradient: string;
  }>;
  imageSizes: Array<{
    slug: string;
    name: string;
  }>;
  maxWidth: number;
  titlePlaceholder: string;
  disableCustomColors: boolean;
  disableCustomFontSizes: boolean;
  disableCustomGradients: boolean;
  enableCustomSpacing: boolean;
  enableCustomUnits: boolean;
  isRTL: boolean;
  keepCaretInsideBlock: boolean;
  hasFixedToolbar: boolean;
  hasInlineToolbar: boolean;
  showInserterHelpPanel: boolean;
  supportsLayout: boolean;
  widgetAreaId?: string;
  __experimentalBlockPatterns: Array<{
    name: string;
    title: string;
    content: string;
    categories: string[];
    keywords: string[];
    description: string;
  }>;
  __experimentalBlockPatternCategories: Array<{
    name: string;
    label: string;
  }>;
}

// Block inserter types
export interface BlockInserterTab {
  name: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface BlockInserterItem {
  id: string;
  name: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  description?: string;
  keywords: string[];
  variations?: Array<{
    name: string;
    title: string;
    icon?: React.ComponentType<{ className?: string }>;
    description?: string;
    attributes?: Record<string, any>;
    innerBlocks?: Array<[string, Record<string, any>]>;
  }>;
  frequencyRank?: number;
  hasChildBlocksWithInserterSupport?: boolean;
}

// Theme and template types
export interface ThemeTemplate {
  id: string;
  name: string;
  slug: string;
  description?: string;
  previewImage?: string;
  content: GutenbergBlock[];
  config: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
    headerStyle?: string;
    buttonStyle?: string;
    cardStyle?: string;
  };
  isPremium?: boolean;
  isActive?: boolean;
}

// History and undo/redo
export interface HistoryState {
  past: GutenbergBlock[][];
  present: GutenbergBlock[];
  future: GutenbergBlock[][];
}

export interface HistoryAction {
  type: 'UNDO' | 'REDO' | 'RECORD';
  blocks?: GutenbergBlock[];
}