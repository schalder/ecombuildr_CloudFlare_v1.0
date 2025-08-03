import React, { useState, useCallback } from 'react';
import { Save, Eye, EyeOff, Undo, Redo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditorState } from './hooks/useEditorState';
import { EditorCanvas } from './components/EditorCanvas';
import { EditorSidebar } from './components/EditorSidebar';
import { BlockInserter } from './components/BlockInserter';
import { GutenbergBlock } from './types';

interface GutenbergEditorProps {
  initialBlocks?: GutenbergBlock[];
  onSave?: (blocks: GutenbergBlock[]) => void;
  onPreview?: () => void;
  className?: string;
}

export const GutenbergEditor: React.FC<GutenbergEditorProps> = ({
  initialBlocks = [],
  onSave,
  onPreview,
  className = '',
}) => {
  const {
    blocks,
    editorState,
    canUndo,
    canRedo,
    updateBlocks,
    undo,
    redo,
    selectBlock,
    clearSelection,
    getBlockById,
    insertBlock,
    updateBlock,
    removeBlock,
    duplicateBlock,
    toggleInserter,
    setInserterSearchTerm,
    setPreviewMode,
    setDeviceType,
    generateBlockId,
  } = useEditorState(initialBlocks);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inserterIndex, setInserterIndex] = useState(0);

  const selectedBlock = editorState.selectedBlockIds.length === 1 
    ? getBlockById(editorState.selectedBlockIds[0]) 
    : null;

  const handleInsertBlock = useCallback((blockName: string, variation?: any) => {
    const newBlock: GutenbergBlock = {
      id: generateBlockId(),
      type: blockName,
      content: variation?.attributes || {},
      attributes: variation?.attributes || {}
    };

    insertBlock(newBlock, inserterIndex);
    selectBlock(newBlock.id);
  }, [generateBlockId, insertBlock, inserterIndex, selectBlock]);

  const handleOpenInserter = useCallback((index: number = blocks.length) => {
    setInserterIndex(index);
    toggleInserter(true);
  }, [blocks.length, toggleInserter]);

  const handleBlockMove = useCallback((blockId: string, direction: 'up' | 'down') => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;

    const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(blockIndex, 1);
    newBlocks.splice(newIndex, 0, movedBlock);
    updateBlocks(newBlocks);
  }, [blocks, updateBlocks]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(blocks);
    }
  }, [blocks, onSave]);

  return (
    <div className={`h-screen flex flex-col bg-background ${className}`}>
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewMode(!editorState.isPreviewMode)}
            >
              {editorState.isPreviewMode ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </>
              )}
            </Button>
            
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <EditorCanvas
          blocks={blocks}
          selectedBlockIds={editorState.selectedBlockIds}
          focusedBlockId={editorState.focusedBlockId}
          onBlocksChange={updateBlocks}
          onBlockSelect={selectBlock}
          onBlockUpdate={updateBlock}
          onBlockRemove={removeBlock}
          onBlockDuplicate={duplicateBlock}
          onBlockMove={handleBlockMove}
          onOpenInserter={handleOpenInserter}
          onShowBlockSettings={(blockId) => selectBlock(blockId)}
          deviceType={editorState.deviceType}
          isPreviewMode={editorState.isPreviewMode}
        />

        <EditorSidebar
          selectedBlock={selectedBlock}
          blocks={blocks}
          onBlockSelect={selectBlock}
          onBlockUpdate={updateBlock}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          deviceType={editorState.deviceType}
          onDeviceTypeChange={setDeviceType}
        />
      </div>

      {/* Block inserter */}
      <BlockInserter
        isOpen={editorState.isInserterOpen}
        onClose={() => toggleInserter(false)}
        onInsertBlock={handleInsertBlock}
        searchTerm={editorState.inserterSearchTerm}
        onSearchTermChange={setInserterSearchTerm}
      />
    </div>
  );
};