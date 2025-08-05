import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PageBuilderData } from './types';
import { usePageBuilderState } from './hooks/usePageBuilderState';
import { CanvasArea } from './components/CanvasArea';
import { ElementLibrary } from './components/ElementLibrary';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ResponsiveControls } from './components/ResponsiveControls';

interface DragDropPageBuilderProps {
  initialData?: PageBuilderData;
  onChange: (data: PageBuilderData) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export const DragDropPageBuilder: React.FC<DragDropPageBuilderProps> = ({
  initialData,
  onChange,
  onSave,
  isSaving = false
}) => {
  const {
    pageData,
    selectedElement,
    deviceType,
    isPreviewMode,
    canUndo,
    canRedo,
    selectElement,
    updateElement,
    addElement,
    moveElement,
    removeElement,
    setDeviceType,
    setPreviewMode,
    undo,
    redo,
    updatePageData
  } = usePageBuilderState(initialData);

  // Sync changes with parent component
  React.useEffect(() => {
    onChange(pageData);
  }, [pageData, onChange]);

  const handleAddSection = () => {
    const newSection = {
      id: `pb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      width: 'wide' as const,
      rows: []
    };
    
    updatePageData({
      ...pageData,
      sections: [...pageData.sections, newSection]
    });
  };

  const handleAddRow = (sectionId: string) => {
    const newRow = {
      id: `pb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      columnLayout: '1-1' as const,
      columns: [
        {
          id: `pb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          width: 6,
          elements: []
        },
        {
          id: `pb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          width: 6,
          elements: []
        }
      ]
    };

    updatePageData({
      ...pageData,
      sections: pageData.sections.map(section =>
        section.id === sectionId
          ? { ...section, rows: [...section.rows, newRow] }
          : section
      )
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-background">
        {/* Element Library Sidebar */}
        <div className="w-80 border-r bg-card">
          <ElementLibrary 
            searchTerm=""
            onAddElement={() => {}}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Toolbar */}
          <div className="border-b bg-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">Page Builder</h2>
              <ResponsiveControls
                deviceType={deviceType}
                onDeviceChange={setDeviceType}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode(!isPreviewMode)}
                className="px-3 py-1 text-sm border rounded hover:bg-muted"
              >
                {isPreviewMode ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={undo}
                disabled={!canUndo}
                className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50"
              >
                Undo
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50"
              >
                Redo
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="px-4 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-auto">
            <CanvasArea
              pageData={pageData}
              deviceType={deviceType}
              isPreviewMode={isPreviewMode}
              onSelectElement={selectElement}
              onUpdateElement={updateElement}
              onAddElement={addElement}
              onMoveElement={moveElement}
              onRemoveElement={removeElement}
              onAddSection={handleAddSection}
              onAddRow={handleAddRow}
            />
          </div>
        </div>

        {/* Properties Panel */}
        {selectedElement && !isPreviewMode && (
          <div className="w-80 border-l bg-card">
            <div className="p-4">
              <h3 className="font-semibold mb-4">Element Properties</h3>
              <p className="text-sm text-muted-foreground">
                Selected: {selectedElement.type}
              </p>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};