import React, { useState, useMemo, useCallback } from 'react';
import { Search, Plus, X, Grid3X3, Type, Image, Layout, Zap, ShoppingBag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { gutenbergRegistry } from '../registry/GutenbergRegistry';
import { GutenbergBlock } from '../types';

interface BlockInserterProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertBlock: (blockName: string, variation?: any) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

const categoryIcons = {
  text: Type,
  media: Image,
  design: Layout,
  widgets: Zap,
  theme: Grid3X3,
  commerce: ShoppingBag,
};

const tabs = [
  { id: 'blocks', label: 'Blocks', icon: Grid3X3 },
  { id: 'patterns', label: 'Patterns', icon: Layout },
  { id: 'media', label: 'Media', icon: Image },
];

export const BlockInserter: React.FC<BlockInserterProps> = ({
  isOpen,
  onClose,
  onInsertBlock,
  searchTerm,
  onSearchTermChange,
}) => {
  const [activeTab, setActiveTab] = useState('blocks');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get all categories
  const categories = useMemo(() => {
    const allCategories = gutenbergRegistry.getCategories();
    return [
      { slug: 'all', title: 'All', icon: Grid3X3 },
      ...allCategories.map(cat => ({
        ...cat,
        icon: categoryIcons[cat.slug as keyof typeof categoryIcons] || Grid3X3
      }))
    ];
  }, []);

  // Get filtered blocks
  const filteredBlocks = useMemo(() => {
    const blocks = gutenbergRegistry.getInserterItems(
      searchTerm,
      selectedCategory === 'all' ? undefined : selectedCategory
    );

    // Group by category
    const grouped = blocks.reduce((acc, block) => {
      if (!acc[block.category]) {
        acc[block.category] = [];
      }
      acc[block.category].push(block);
      return acc;
    }, {} as Record<string, typeof blocks>);

    return grouped;
  }, [searchTerm, selectedCategory]);

  // Handle block insertion
  const handleBlockInsert = useCallback((blockName: string, variation?: any) => {
    onInsertBlock(blockName, variation);
    onClose();
  }, [onInsertBlock, onClose]);

  // Handle search
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchTermChange(e.target.value);
  }, [onSearchTermChange]);

  const renderBlockItem = (block: any) => {
    const Icon = block.icon;
    
    return (
      <div key={block.id} className="space-y-2">
        {/* Main block */}
        <Button
          variant="ghost"
          className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-accent/50 border border-transparent hover:border-border"
          onClick={() => handleBlockInsert(block.name)}
        >
          <div className="w-8 h-8 flex items-center justify-center bg-muted rounded">
            <Icon className="w-4 h-4" />
          </div>
          <div className="text-center">
            <div className="text-sm font-medium">{block.title}</div>
            {block.description && (
              <div className="text-xs text-muted-foreground line-clamp-2">
                {block.description}
              </div>
            )}
          </div>
        </Button>

        {/* Block variations */}
        {block.variations && block.variations.length > 0 && (
          <div className="ml-4 space-y-1">
            {block.variations.map((variation: any) => {
              const VariationIcon = variation.icon || Icon;
              return (
                <Button
                  key={variation.name}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-auto p-2"
                  onClick={() => handleBlockInsert(block.name, variation)}
                >
                  <VariationIcon className="w-3 h-3 mr-2 shrink-0" />
                  <div className="text-left">
                    <div className="text-xs font-medium">{variation.title}</div>
                    {variation.description && (
                      <div className="text-xs text-muted-foreground">
                        {variation.description}
                      </div>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderBlocksTab = () => (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search blocks..."
          value={searchTerm}
          onChange={handleSearch}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.slug}
              variant={selectedCategory === category.slug ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.slug)}
              className="h-8"
            >
              <Icon className="w-3 h-3 mr-1" />
              {category.title}
            </Button>
          );
        })}
      </div>

      {/* Blocks */}
      <ScrollArea className="h-96">
        {Object.keys(filteredBlocks).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Grid3X3 className="w-8 h-8 mx-auto mb-2" />
            <p>No blocks found</p>
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchTermChange('')}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredBlocks).map(([categorySlug, blocks]) => {
              const category = categories.find(c => c.slug === categorySlug);
              if (!category || blocks.length === 0) return null;

              return (
                <div key={categorySlug} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <category.icon className="w-4 h-4" />
                    <h3 className="text-sm font-medium">{category.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {blocks.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {blocks.map(renderBlockItem)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const renderPatternsTab = () => (
    <div className="space-y-4">
      <div className="text-center py-8 text-muted-foreground">
        <Layout className="w-8 h-8 mx-auto mb-2" />
        <p>Block patterns coming soon...</p>
        <p className="text-xs mt-1">Create reusable block combinations</p>
      </div>
    </div>
  );

  const renderMediaTab = () => (
    <div className="space-y-4">
      <div className="text-center py-8 text-muted-foreground">
        <Image className="w-8 h-8 mx-auto mb-2" />
        <p>Media library coming soon...</p>
        <p className="text-xs mt-1">Browse and insert images, videos, and files</p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Add Block</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="px-6 pb-6">
              <TabsContent value="blocks" className="mt-4">
                {renderBlocksTab()}
              </TabsContent>
              <TabsContent value="patterns" className="mt-4">
                {renderPatternsTab()}
              </TabsContent>
              <TabsContent value="media" className="mt-4">
                {renderMediaTab()}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};