import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { blockRegistry } from './registry';

interface BlockInserterProps {
  onSelect: (blockType: string) => void;
  onClose: () => void;
}

export const BlockInserter: React.FC<BlockInserterProps> = ({ onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const blocks = blockRegistry.getAll();
  const categories = Array.from(new Set(blocks.map(block => block.settings.category)));

  const filteredBlocks = blocks.filter(block => {
    const matchesSearch = block.settings.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || block.settings.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedBlocks = categories.reduce((acc, category) => {
    acc[category] = filteredBlocks.filter(block => block.settings.category === category);
    return acc;
  }, {} as Record<string, typeof filteredBlocks>);

  const handleBlockSelect = (blockType: string) => {
    onSelect(blockType);
    onClose();
  };

  const categoryLabels = {
    text: 'Text',
    media: 'Media',
    layout: 'Layout',
    interactive: 'Interactive',
    store: 'Store',
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add a block</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search blocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {categories.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {categoryLabels[category as keyof typeof categoryLabels] || category}
              </Badge>
            ))}
          </div>

          {/* Block grid */}
          <div className="max-h-96 overflow-y-auto space-y-6">
            {Object.entries(groupedBlocks).map(([category, categoryBlocks]) => {
              if (categoryBlocks.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {categoryLabels[category as keyof typeof categoryLabels] || category}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categoryBlocks.map(block => {
                      const Icon = block.settings.icon;
                      return (
                        <Button
                          key={block.name}
                          variant="outline"
                          className="h-20 flex flex-col gap-2 justify-center items-center hover:border-primary"
                          onClick={() => handleBlockSelect(block.name)}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs">{block.settings.title}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBlocks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No blocks found for "{searchTerm}"
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};