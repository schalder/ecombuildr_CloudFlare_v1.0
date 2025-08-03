import React from 'react';
import { 
  GripVertical, 
  Copy, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  MoreVertical,
  Type,
  Palette,
  AlignLeft,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { GutenbergBlock } from '../types';

interface BlockToolbarProps {
  block: GutenbergBlock;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onShowSettings: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isFixed?: boolean;
  className?: string;
}

export const BlockToolbar: React.FC<BlockToolbarProps> = ({
  block,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
  onShowSettings,
  canMoveUp,
  canMoveDown,
  isFixed = false,
  className = ''
}) => {
  return (
    <div 
      className={`
        flex items-center gap-1 bg-background border rounded-md shadow-lg z-50
        ${isFixed ? 'sticky top-4' : 'absolute -top-12 left-0'}
        ${className}
      `}
      style={{ minWidth: 'fit-content' }}
    >
      {/* Drag handle */}
      <div 
        className="flex items-center justify-center w-8 h-8 hover:bg-muted rounded cursor-move"
        title="Drag to move"
      >
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Move up/down */}
      <Button
        variant="ghost"
        size="sm"
        className="w-8 h-8 p-0"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        title="Move up"
      >
        <ArrowUp className="w-3 h-3" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="w-8 h-8 p-0"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        title="Move down"
      >
        <ArrowDown className="w-3 h-3" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Block-specific tools would go here */}
      {block.type === 'core/paragraph' && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
            title="Text formatting"
          >
            <Type className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
            title="Text alignment"
          >
            <AlignLeft className="w-3 h-3" />
          </Button>
        </>
      )}

      {block.type === 'core/heading' && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
            title="Heading level"
          >
            <Type className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
            title="Text alignment"
          >
            <AlignLeft className="w-3 h-3" />
          </Button>
        </>
      )}

      {/* Color controls for blocks that support it */}
      <Button
        variant="ghost"
        size="sm"
        className="w-8 h-8 p-0"
        title="Colors"
      >
        <Palette className="w-3 h-3" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Settings */}
      <Button
        variant="ghost"
        size="sm"
        className="w-8 h-8 p-0"
        onClick={onShowSettings}
        title="Block settings"
      >
        <Settings className="w-3 h-3" />
      </Button>

      {/* More options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
            title="More options"
          >
            <MoreVertical className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={onRemove}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove block
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};