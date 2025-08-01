import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, GripVertical, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Block } from './types';
import { blockRegistry } from './registry';
import { BlockInserter } from './BlockInserter';

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onChange }) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showInserter, setShowInserter] = useState(false);
  const [inserterPosition, setInserterPosition] = useState(0);

  const updateBlock = useCallback((blockId: string, updates: Partial<Block['content']>) => {
    const newBlocks = blocks.map(block =>
      block.id === blockId
        ? { ...block, content: { ...block.content, ...updates } }
        : block
    );
    onChange(newBlocks);
  }, [blocks, onChange]);

  const removeBlock = useCallback((blockId: string) => {
    const newBlocks = blocks.filter(block => block.id !== blockId);
    onChange(newBlocks);
    setSelectedBlockId(null);
  }, [blocks, onChange]);

  const duplicateBlock = useCallback((blockId: string) => {
    const blockIndex = blocks.findIndex(block => block.id === blockId);
    if (blockIndex === -1) return;

    const originalBlock = blocks[blockIndex];
    const duplicatedBlock: Block = {
      ...originalBlock,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const newBlocks = [
      ...blocks.slice(0, blockIndex + 1),
      duplicatedBlock,
      ...blocks.slice(blockIndex + 1),
    ];
    onChange(newBlocks);
  }, [blocks, onChange]);

  const addBlock = useCallback((blockType: string, position: number) => {
    const newBlock: Block = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: blockType,
      content: {},
    };

    const newBlocks = [
      ...blocks.slice(0, position),
      newBlock,
      ...blocks.slice(position),
    ];
    onChange(newBlocks);
    setSelectedBlockId(newBlock.id);
    setShowInserter(false);
  }, [blocks, onChange]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const newBlocks = Array.from(blocks);
    const [reorderedBlock] = newBlocks.splice(result.source.index, 1);
    newBlocks.splice(result.destination.index, 0, reorderedBlock);

    onChange(newBlocks);
  };

  const openInserter = (position: number) => {
    setInserterPosition(position);
    setShowInserter(true);
  };

  return (
    <div className="space-y-4">
      {/* Add first block button */}
      {blocks.length === 0 && (
        <div className="text-center py-12">
          <Button
            onClick={() => openInserter(0)}
            variant="outline"
            size="lg"
            className="text-muted-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add your first block
          </Button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="blocks">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {blocks.map((block, index) => {
                const blockRegistration = blockRegistry.get(block.type);
                if (!blockRegistration) return null;

                const EditComponent = blockRegistration.edit;
                const isSelected = selectedBlockId === block.id;

                return (
                  <React.Fragment key={block.id}>
                    {/* Block inserter */}
                    <div className="flex justify-center">
                      <Button
                        onClick={() => openInserter(index)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <Draggable draggableId={block.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`relative group ${snapshot.isDragging ? 'z-50' : ''}`}
                        >
                          {/* Block toolbar */}
                          {isSelected && (
                            <div className="absolute -top-10 left-0 z-10 flex gap-1 bg-background border rounded-md p-1 shadow-md">
                              <div
                                {...provided.dragHandleProps}
                                className="p-1 hover:bg-muted rounded cursor-move"
                              >
                                <GripVertical className="h-3 w-3" />
                              </div>
                              <Button
                                onClick={() => duplicateBlock(block.id)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => removeBlock(block.id)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}

                          {/* Block content */}
                          <div onClick={() => setSelectedBlockId(block.id)}>
                            <EditComponent
                              block={block}
                              onUpdate={(updates) => updateBlock(block.id, updates)}
                              onRemove={() => removeBlock(block.id)}
                              onDuplicate={() => duplicateBlock(block.id)}
                              isSelected={isSelected}
                              onSelect={() => setSelectedBlockId(block.id)}
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  </React.Fragment>
                );
              })}
              {provided.placeholder}

              {/* Final inserter */}
              {blocks.length > 0 && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => openInserter(blocks.length)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add block
                  </Button>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Block inserter modal */}
      {showInserter && (
        <BlockInserter
          onSelect={(blockType) => addBlock(blockType, inserterPosition)}
          onClose={() => setShowInserter(false)}
        />
      )}
    </div>
  );
};