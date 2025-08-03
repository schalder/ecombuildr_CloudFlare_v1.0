import React, { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Eye, 
  Save, 
  Undo, 
  Redo,
  Settings,
  Plus,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ElementLibrary } from './components/ElementLibrary';
import { CanvasArea } from './components/CanvasArea';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ResponsiveControls } from './components/ResponsiveControls';
import { PageBuilderData, PageBuilderElement } from './types';
import { usePageBuilderState } from './hooks/usePageBuilderState';

interface ElementorPageBuilderProps {
  initialData?: PageBuilderData;
  onSave?: (data: PageBuilderData) => void;
  onPreview?: () => void;
}

export const ElementorPageBuilder: React.FC<ElementorPageBuilderProps> = ({
  initialData,
  onSave,
  onPreview
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
    removeElement,
    setDeviceType,
    setPreviewMode,
    undo,
    redo,
    updatePageData
  } = usePageBuilderState(initialData);

  const [searchTerm, setSearchTerm] = useState('');
  const [activePanel, setActivePanel] = useState<'elements' | 'properties'>('elements');

  const handleSave = useCallback(() => {
    onSave?.(pageData);
  }, [pageData, onSave]);

  const handleAddElement = useCallback((elementType: string, targetPath: string) => {
    addElement(elementType, targetPath);
  }, [addElement]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-background">
        {/* Top Toolbar */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
              className="text-muted-foreground hover:text-foreground"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
              className="text-muted-foreground hover:text-foreground"
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <ResponsiveControls
              deviceType={deviceType}
              onDeviceChange={setDeviceType}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewMode(!isPreviewMode)}
              className={isPreviewMode ? 'bg-primary text-primary-foreground' : ''}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreview}
              className="text-muted-foreground hover:text-foreground"
            >
              <Monitor className="h-4 w-4 mr-2" />
              Preview Page
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Left Sidebar - Elements & Widgets */}
          <div className="w-80 border-r border-border bg-card flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search elements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <ElementLibrary
                searchTerm={searchTerm}
                onAddElement={handleAddElement}
              />
            </ScrollArea>
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 flex flex-col bg-muted/20">
            <CanvasArea
              pageData={pageData}
              selectedElement={selectedElement}
              deviceType={deviceType}
              isPreviewMode={isPreviewMode}
              onSelectElement={selectElement}
              onUpdateElement={updateElement}
              onAddElement={handleAddElement}
              onRemoveElement={removeElement}
            />
          </div>

          {/* Right Sidebar - Properties & Settings */}
          <div className="w-80 border-l border-border bg-card flex flex-col">
            <Tabs value={activePanel} onValueChange={(value: any) => setActivePanel(value)} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
                <TabsTrigger value="elements">Elements</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-hidden">
                <TabsContent value="elements" className="h-full m-0 p-4">
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground">STRUCTURE</h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleAddElement('section', 'root')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="properties" className="h-full m-0">
                  <PropertiesPanel
                    selectedElement={selectedElement}
                    deviceType={deviceType}
                    onUpdateElement={updateElement}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};