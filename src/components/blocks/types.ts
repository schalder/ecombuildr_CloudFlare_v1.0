// Block system types
export interface Block {
  id: string;
  type: string;
  content: Record<string, any>;
  attributes?: Record<string, any>;
}

export interface BlockType {
  name: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'text' | 'media' | 'layout' | 'interactive' | 'store' | 'marketing';
  supports: {
    alignment?: boolean;
    spacing?: boolean;
    color?: boolean;
  };
}

export interface BlockRegistration {
  name: string;
  settings: BlockType;
  edit: React.ComponentType<BlockEditProps>;
  save: React.ComponentType<BlockSaveProps>;
}

export interface BlockEditProps {
  block: Block;
  onUpdate: (updates: Partial<Block['content']>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  isSelected: boolean;
  onSelect: () => void;
}

export interface BlockSaveProps {
  block: Block;
}