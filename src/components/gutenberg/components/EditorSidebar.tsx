import React, { useState } from 'react';
import { Settings, Layers, Eye, Palette, Type, Layout, Smartphone, Tablet, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { GutenbergBlock } from '../types';

interface EditorSidebarProps {
  selectedBlock: GutenbergBlock | null;
  blocks: GutenbergBlock[];
  onBlockSelect: (blockId: string) => void;
  onBlockUpdate: (blockId: string, updates: Partial<GutenbergBlock>) => void;
  isOpen: boolean;
  onToggle: () => void;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  onDeviceTypeChange: (deviceType: 'desktop' | 'tablet' | 'mobile') => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  selectedBlock,
  blocks,
  onBlockSelect,
  onBlockUpdate,
  isOpen,
  onToggle,
  deviceType,
  onDeviceTypeChange,
}) => {
  const [activeTab, setActiveTab] = useState('block');

  if (!isOpen) {
    return (
      <div className="w-12 border-l bg-background flex flex-col items-center py-4 gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-8 h-8 p-0"
          title="Open sidebar"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  const renderBlockInspector = () => {
    if (!selectedBlock) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Settings className="w-8 h-8 mx-auto mb-2" />
          <p>Select a block to edit its settings</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Block Settings</h3>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{selectedBlock.type}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {/* Block-specific settings would go here */}
              <div className="space-y-2">
                <Label htmlFor="block-id" className="text-xs">Block ID</Label>
                <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                  {selectedBlock.id}
                </div>
              </div>

              {/* Advanced settings */}
              <Separator />
              <div className="space-y-3">
                <Label className="text-xs font-medium">Advanced</Label>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="custom-css" className="text-xs">Custom CSS Classes</Label>
                  <Switch id="custom-css" />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="anchor" className="text-xs">HTML Anchor</Label>
                  <Switch id="anchor" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Color settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Colors
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-8">
                Text
              </Button>
              <Button variant="outline" size="sm" className="h-8">
                Background
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Type className="w-4 h-4" />
              Typography
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-8">
                Font Size
              </Button>
              <Button variant="outline" size="sm" className="h-8">
                Line Height
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Spacing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Spacing
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-8">
                Margin
              </Button>
              <Button variant="outline" size="sm" className="h-8">
                Padding
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDocumentInspector = () => (
    <div className="space-y-4">
      {/* Responsive controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Preview Device</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-1">
            <Button
              variant={deviceType === 'desktop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onDeviceTypeChange('desktop')}
              className="h-8"
            >
              <Monitor className="w-3 h-3" />
            </Button>
            <Button
              variant={deviceType === 'tablet' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onDeviceTypeChange('tablet')}
              className="h-8"
            >
              <Tablet className="w-3 h-3" />
            </Button>
            <Button
              variant={deviceType === 'mobile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onDeviceTypeChange('mobile')}
              className="h-8"
            >
              <Smartphone className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Page settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Page Settings</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="wide-blocks" className="text-xs">Wide Blocks</Label>
            <Switch id="wide-blocks" />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="full-height" className="text-xs">Full Height</Label>
            <Switch id="full-height" />
          </div>
        </CardContent>
      </Card>

      {/* Global styles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Global Styles</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Button variant="outline" size="sm" className="w-full">
            Customize Styles
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderBlockNavigation = () => {
    const renderBlockItem = (block: GutenbergBlock, depth = 0) => (
      <div key={block.id} className="space-y-1">
        <Button
          variant={selectedBlock?.id === block.id ? 'secondary' : 'ghost'}
          size="sm"
          className="w-full justify-start h-7 text-xs"
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => onBlockSelect(block.id)}
        >
          <div className="truncate">
            {block.type.replace('core/', '').replace('theme/', '')}
          </div>
          {block.innerBlocks && block.innerBlocks.length > 0 && (
            <Badge variant="outline" className="ml-auto text-xs h-4">
              {block.innerBlocks.length}
            </Badge>
          )}
        </Button>
        {block.innerBlocks?.map(innerBlock => renderBlockItem(innerBlock, depth + 1))}
      </div>
    );

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Block Navigation</h3>
          <Badge variant="secondary" className="text-xs">
            {blocks.length}
          </Badge>
        </div>
        <ScrollArea className="h-64">
          <div className="space-y-1">
            {blocks.map(block => renderBlockItem(block))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="w-80 border-l bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Inspector</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-6 h-6 p-0"
          >
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
            <TabsTrigger value="block" className="text-xs">
              <Settings className="w-3 h-3 mr-1" />
              Block
            </TabsTrigger>
            <TabsTrigger value="document" className="text-xs">
              <Eye className="w-3 h-3 mr-1" />
              Page
            </TabsTrigger>
            <TabsTrigger value="navigation" className="text-xs">
              <Layers className="w-3 h-3 mr-1" />
              List
            </TabsTrigger>
          </TabsList>

          <div className="px-4 pb-4">
            <TabsContent value="block" className="mt-4">
              <ScrollArea className="h-96">
                {renderBlockInspector()}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="document" className="mt-4">
              <ScrollArea className="h-96">
                {renderDocumentInspector()}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="navigation" className="mt-4">
              {renderBlockNavigation()}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};