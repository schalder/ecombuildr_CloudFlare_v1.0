import { useState, useCallback, useRef, useMemo } from 'react';
import { GutenbergBlock, EditorState, HistoryState } from '../types';

export const useEditorState = (initialBlocks: GutenbergBlock[] = []) => {
  // History management for undo/redo
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialBlocks,
    future: []
  });

  // Current editor state
  const [editorState, setEditorState] = useState<Omit<EditorState, 'blocks'>>({
    selectedBlockIds: [],
    multiSelectedBlockIds: [],
    focusedBlockId: null,
    insertionPoint: null,
    isDragging: false,
    isInserterOpen: false,
    inserterSearchTerm: '',
    preferences: {
      fixedToolbar: false,
      welcomeGuide: true,
      fullscreenMode: false,
      distractionFree: false,
      keepCaretInsideBlock: true,
      showBlockBreadcrumbs: true,
      showListViewOutline: false,
    },
    editedPostContent: '',
    editedPostId: null,
    isPreviewMode: false,
    deviceType: 'desktop',
    zoom: 100,
  });

  const blocks = history.present;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Generate unique block ID
  const generateBlockId = useCallback(() => {
    return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Record action for undo/redo
  const recordHistory = useCallback((newBlocks: GutenbergBlock[]) => {
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: newBlocks,
      future: []
    }));
  }, []);

  // Update blocks with history tracking
  const updateBlocks = useCallback((newBlocks: GutenbergBlock[]) => {
    recordHistory(newBlocks);
  }, [recordHistory]);

  // Undo action
  const undo = useCallback(() => {
    if (!canUndo) return;
    
    setHistory(prev => ({
      past: prev.past.slice(0, -1),
      present: prev.past[prev.past.length - 1],
      future: [prev.present, ...prev.future]
    }));
  }, [canUndo]);

  // Redo action
  const redo = useCallback(() => {
    if (!canRedo) return;
    
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: prev.future[0],
      future: prev.future.slice(1)
    }));
  }, [canRedo]);

  // Block selection
  const selectBlock = useCallback((blockId: string, isMultiSelect = false) => {
    setEditorState(prev => {
      if (isMultiSelect) {
        const isAlreadySelected = prev.selectedBlockIds.includes(blockId);
        return {
          ...prev,
          selectedBlockIds: isAlreadySelected 
            ? prev.selectedBlockIds.filter(id => id !== blockId)
            : [...prev.selectedBlockIds, blockId],
          multiSelectedBlockIds: isAlreadySelected
            ? prev.multiSelectedBlockIds.filter(id => id !== blockId)
            : [...prev.multiSelectedBlockIds, blockId]
        };
      } else {
        return {
          ...prev,
          selectedBlockIds: [blockId],
          multiSelectedBlockIds: [],
          focusedBlockId: blockId
        };
      }
    });
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      selectedBlockIds: [],
      multiSelectedBlockIds: [],
      focusedBlockId: null
    }));
  }, []);

  // Get block by ID
  const getBlockById = useCallback((blockId: string): GutenbergBlock | null => {
    const findBlock = (blocks: GutenbergBlock[]): GutenbergBlock | null => {
      for (const block of blocks) {
        if (block.id === blockId) return block;
        if (block.innerBlocks) {
          const found = findBlock(block.innerBlocks);
          if (found) return found;
        }
      }
      return null;
    };
    return findBlock(blocks);
  }, [blocks]);

  // Get block index
  const getBlockIndex = useCallback((blockId: string, parentId?: string): number => {
    const targetBlocks = parentId 
      ? getBlockById(parentId)?.innerBlocks || []
      : blocks;
    return targetBlocks.findIndex(block => block.id === blockId);
  }, [blocks, getBlockById]);

  // Insert block
  const insertBlock = useCallback((block: GutenbergBlock, index?: number, parentId?: string) => {
    const newBlock = { ...block, id: block.id || generateBlockId() };
    
    if (parentId) {
      const newBlocks = blocks.map(b => {
        if (b.id === parentId) {
          const innerBlocks = [...(b.innerBlocks || [])];
          const insertIndex = index !== undefined ? index : innerBlocks.length;
          innerBlocks.splice(insertIndex, 0, newBlock);
          return { ...b, innerBlocks };
        }
        return b;
      });
      updateBlocks(newBlocks);
    } else {
      const newBlocks = [...blocks];
      const insertIndex = index !== undefined ? index : blocks.length;
      newBlocks.splice(insertIndex, 0, newBlock);
      updateBlocks(newBlocks);
    }
    
    return newBlock.id;
  }, [blocks, generateBlockId, updateBlocks]);

  // Update block
  const updateBlock = useCallback((blockId: string, updates: Partial<GutenbergBlock>) => {
    const updateBlockRecursive = (blocks: GutenbergBlock[]): GutenbergBlock[] => {
      return blocks.map(block => {
        if (block.id === blockId) {
          return { ...block, ...updates };
        }
        if (block.innerBlocks) {
          return {
            ...block,
            innerBlocks: updateBlockRecursive(block.innerBlocks)
          };
        }
        return block;
      });
    };

    const newBlocks = updateBlockRecursive(blocks);
    updateBlocks(newBlocks);
  }, [blocks, updateBlocks]);

  // Remove block
  const removeBlock = useCallback((blockId: string) => {
    const removeBlockRecursive = (blocks: GutenbergBlock[]): GutenbergBlock[] => {
      return blocks.filter(block => {
        if (block.id === blockId) return false;
        if (block.innerBlocks) {
          block.innerBlocks = removeBlockRecursive(block.innerBlocks);
        }
        return true;
      });
    };

    const newBlocks = removeBlockRecursive(blocks);
    updateBlocks(newBlocks);
    
    // Clear selection if removed block was selected
    if (editorState.selectedBlockIds.includes(blockId)) {
      clearSelection();
    }
  }, [blocks, updateBlocks, editorState.selectedBlockIds, clearSelection]);

  // Move block
  const moveBlock = useCallback((blockId: string, newIndex: number, newParentId?: string) => {
    const block = getBlockById(blockId);
    if (!block) return;

    // First remove the block
    removeBlock(blockId);
    
    // Then insert it at the new position
    insertBlock(block, newIndex, newParentId);
  }, [getBlockById, removeBlock, insertBlock]);

  // Duplicate block
  const duplicateBlock = useCallback((blockId: string) => {
    const block = getBlockById(blockId);
    if (!block) return;

    const blockIndex = getBlockIndex(blockId);
    const duplicatedBlock = {
      ...block,
      id: generateBlockId(),
      innerBlocks: block.innerBlocks?.map(innerBlock => ({
        ...innerBlock,
        id: generateBlockId()
      }))
    };

    insertBlock(duplicatedBlock, blockIndex + 1);
    return duplicatedBlock.id;
  }, [getBlockById, getBlockIndex, generateBlockId, insertBlock]);

  // Toggle inserter
  const toggleInserter = useCallback((isOpen?: boolean) => {
    setEditorState(prev => ({
      ...prev,
      isInserterOpen: isOpen !== undefined ? isOpen : !prev.isInserterOpen
    }));
  }, []);

  // Set inserter search term
  const setInserterSearchTerm = useCallback((searchTerm: string) => {
    setEditorState(prev => ({
      ...prev,
      inserterSearchTerm: searchTerm
    }));
  }, []);

  // Set preview mode
  const setPreviewMode = useCallback((isPreview: boolean) => {
    setEditorState(prev => ({
      ...prev,
      isPreviewMode: isPreview
    }));
  }, []);

  // Set device type for responsive preview
  const setDeviceType = useCallback((deviceType: 'desktop' | 'tablet' | 'mobile') => {
    setEditorState(prev => ({
      ...prev,
      deviceType
    }));
  }, []);

  return {
    // State
    blocks,
    editorState: { ...editorState, blocks },
    canUndo,
    canRedo,
    
    // Actions
    updateBlocks,
    undo,
    redo,
    selectBlock,
    clearSelection,
    getBlockById,
    getBlockIndex,
    insertBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    duplicateBlock,
    toggleInserter,
    setInserterSearchTerm,
    setPreviewMode,
    setDeviceType,
    generateBlockId,
  };
};