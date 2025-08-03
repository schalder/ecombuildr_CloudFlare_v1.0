import React, { useRef, useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GutenbergBlock } from '../types';
import { gutenbergRegistry } from '../registry/GutenbergRegistry';
import { BlockToolbar } from './BlockToolbar';

interface EditorCanvasProps {
  blocks: GutenbergBlock[];
  selectedBlockIds: string[];
  focusedBlockId: string | null;
  onBlocksChange: (blocks: GutenbergBlock[]) => void;
  onBlockSelect: (blockId: string, isMultiSelect?: boolean) => void;
  onBlockUpdate: (blockId: string, updates: Partial<GutenbergBlock['content']>) => void;
  onBlockRemove: (blockId: string) => void;
  onBlockDuplicate: (blockId: string) => void;
  onBlockMove: (blockId: string, direction: 'up' | 'down') => void;
  onOpenInserter: (index?: number) => void;
  onShowBlockSettings: (blockId: string) => void;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  isPreviewMode: boolean;
  className?: string;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  blocks,
  selectedBlockIds,
  focusedBlockId,
  onBlocksChange,
  onBlockSelect,
  onBlockUpdate,
  onBlockRemove,
  onBlockDuplicate,
  onBlockMove,
  onOpenInserter,
  onShowBlockSettings,
  deviceType,
  isPreviewMode,
  className = '',
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

  // Handle drag and drop
  const handleDragEnd = (result: any) => {
    setDraggedBlockId(null);
    
    if (!result.destination) return;

    const newBlocks = Array.from(blocks);
    const [reorderedBlock] = newBlocks.splice(result.source.index, 1);
    newBlocks.splice(result.destination.index, 0, reorderedBlock);

    onBlocksChange(newBlocks);
  };

  const handleDragStart = (result: any) => {
    setDraggedBlockId(result.draggableId);
  };

  // Get device-specific canvas styles
  const getCanvasStyles = () => {
    switch (deviceType) {
      case 'mobile':
        return { maxWidth: '375px', margin: '0 auto' };
      case 'tablet':
        return { maxWidth: '768px', margin: '0 auto' };
      default:
        return { width: '100%' };
    }
  };

  // Handle click outside to clear selection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (canvasRef.current && !canvasRef.current.contains(event.target as Node)) {
        // Don't clear selection if clicking on toolbar or sidebar
        const target = event.target as Element;
        if (!target.closest('[data-block-toolbar]') && !target.closest('[data-sidebar]')) {
          onBlockSelect('', false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onBlockSelect]);

  const renderBlock = (block: GutenbergBlock, index: number) => {
    const blockRegistration = gutenbergRegistry.get(block.type);
    if (!blockRegistration) {
      console.warn(`Block type "${block.type}" not found in registry`);
      return null;
    }

    const isSelected = selectedBlockIds.includes(block.id);
    const isFocused = focusedBlockId === block.id;
    const isDragging = draggedBlockId === block.id;

    const EditComponent = blockRegistration.edit;
    const canMoveUp = index > 0;
    const canMoveDown = index < blocks.length - 1;

    return (
      <Draggable 
        key={block.id} 
        draggableId={block.id} 
        index={index}
        isDragDisabled={isPreviewMode}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={cn(
              'relative group transition-all duration-200',
              isDragging && 'opacity-50',
              snapshot.isDragging && 'z-50 rotate-2 scale-105'
            )}
          >
            {/* Block inserter above */}
            {!isPreviewMode && (
              <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-primary/10 border border-transparent hover:border-primary/20"
                  onClick={() => onOpenInserter(index)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Block wrapper */}
            <div
              className={cn(
                'relative',
                isSelected && !isPreviewMode && 'ring-2 ring-primary ring-offset-2',
                isFocused && !isPreviewMode && 'ring-2 ring-primary ring-offset-2',
                !isPreviewMode && 'hover:ring-1 hover:ring-muted-foreground/30'
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (!isPreviewMode) {
                  onBlockSelect(block.id, e.metaKey || e.ctrlKey);
                }
              }}
            >
              {/* Block toolbar */}
              {isSelected && !isPreviewMode && (
                <div className="absolute -top-12 left-0 z-40" data-block-toolbar>
                  <BlockToolbar
                    block={block}
                    onMoveUp={() => onBlockMove(block.id, 'up')}
                    onMoveDown={() => onBlockMove(block.id, 'down')}
                    onDuplicate={() => onBlockDuplicate(block.id)}
                    onRemove={() => onBlockRemove(block.id)}
                    onShowSettings={() => onShowBlockSettings(block.id)}
                    canMoveUp={canMoveUp}
                    canMoveDown={canMoveDown}
                  />
                </div>
              )}

              {/* Drag handle for block toolbar */}
              {isSelected && !isPreviewMode && (
                <div
                  {...provided.dragHandleProps}
                  className="absolute -top-12 left-0 z-50"
                  style={{ width: '32px', height: '32px' }}
                />
              )}

              {/* Block content */}
              <div className={cn(
                'block-content',
                isPreviewMode ? 'pointer-events-auto' : 'pointer-events-none'
              )}>
                {isPreviewMode ? (
                  // Render save component in preview mode
                  React.createElement(blockRegistration.save, {
                    block,
                    attributes: block.content,
                    className: block.attributes?.className || ''
                  })
                ) : (
                  // Render edit component in edit mode
                  <EditComponent
                    block={block}
                    onUpdate={(updates) => onBlockUpdate(block.id, updates)}
                    onRemove={() => onBlockRemove(block.id)}
                    onDuplicate={() => onBlockDuplicate(block.id)}
                    onMoveUp={() => onBlockMove(block.id, 'up')}
                    onMoveDown={() => onBlockMove(block.id, 'down')}
                    onSelectNext={() => {}}
                    onSelectPrevious={() => {}}
                    isSelected={isSelected}
                    isMultiSelected={selectedBlockIds.length > 1}
                    onSelect={() => onBlockSelect(block.id)}
                    onFocus={() => onBlockSelect(block.id)}
                    onBlur={() => {}}
                    clientId={block.id}
                    name={block.type}
                    attributes={block.content}
                    setAttributes={(attrs) => onBlockUpdate(block.id, attrs)}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div 
      ref={canvasRef}
      className={cn(
        'flex-1 bg-background transition-all duration-300',
        deviceType === 'mobile' && 'bg-muted/30',
        deviceType === 'tablet' && 'bg-muted/20',
        className
      )}
      style={getCanvasStyles()}
    >
      <div className="min-h-screen p-6">
        {/* Empty state */}
        {blocks.length === 0 && !isPreviewMode && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Start building your page</h3>
              <p className="text-muted-foreground mb-6">
                Add your first block to begin creating content
              </p>
              <Button onClick={() => onOpenInserter(0)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Block
              </Button>
            </div>
          </div>
        )}

        {/* Blocks */}
        <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
          <Droppable droppableId="blocks" isDropDisabled={isPreviewMode}>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={cn(
                  'space-y-6 transition-colors',
                  snapshot.isDraggingOver && 'bg-primary/5'
                )}
              >
                {blocks.map((block, index) => renderBlock(block, index))}
                {provided.placeholder}

                {/* Final inserter */}
                {!isPreviewMode && blocks.length > 0 && (
                  <div className="flex justify-center pt-6">
                    <Button
                      variant="outline"
                      onClick={() => onOpenInserter(blocks.length)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Block
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};