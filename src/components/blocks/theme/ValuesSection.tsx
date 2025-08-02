import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BlockEditProps, BlockSaveProps } from '../types';
import { Settings, Trash2, Copy, Plus, X } from 'lucide-react';

interface ValueItem {
  title: string;
  description: string;
}

interface ValuesSectionContent {
  title: string;
  items: ValueItem[];
}

export const ValuesSectionEdit: React.FC<BlockEditProps> = ({ 
  block, 
  onUpdate, 
  onRemove, 
  onDuplicate, 
  isSelected, 
  onSelect 
}) => {
  const content = block.content as ValuesSectionContent;

  const addValue = () => {
    const newItems = [...(content.items || []), { title: 'New Value', description: 'Description' }];
    onUpdate({ items: newItems });
  };

  const removeValue = (index: number) => {
    const newItems = content.items.filter((_, i) => i !== index);
    onUpdate({ items: newItems });
  };

  const updateValue = (index: number, field: keyof ValueItem, value: string) => {
    const newItems = content.items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    onUpdate({ items: newItems });
  };

  return (
    <div 
      className={`relative group cursor-pointer border-2 transition-all ${
        isSelected ? 'border-primary' : 'border-transparent hover:border-muted-foreground/20'
      }`}
      onClick={onSelect}
    >
      {/* Block Toolbar */}
      {isSelected && (
        <div className="absolute -top-10 left-0 flex items-center gap-2 bg-background border rounded-md px-2 py-1 z-10">
          <Settings className="h-4 w-4" />
          <span className="text-sm font-medium">Values Section</span>
          <Button variant="ghost" size="sm" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Edit Form */}
      {isSelected && (
        <div className="absolute top-0 right-0 w-96 bg-background border rounded-lg p-4 shadow-lg z-20 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Section Title</Label>
              <Input
                id="title"
                value={content.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Our Values"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Values</Label>
                <Button variant="outline" size="sm" onClick={addValue}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {content.items?.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Value {index + 1}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeValue(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={item.title}
                      onChange={(e) => updateValue(index, 'title', e.target.value)}
                      placeholder="Value title"
                      className="text-sm"
                    />
                    <Textarea
                      value={item.description}
                      onChange={(e) => updateValue(index, 'description', e.target.value)}
                      placeholder="Value description"
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      <ValuesSectionSave block={block} />
    </div>
  );
};

export const ValuesSectionSave: React.FC<BlockSaveProps> = ({ block }) => {
  const content = block.content as ValuesSectionContent;

  return (
    <section className="py-16 bg-green-50">
      <div className="container">
        <h2 className="text-3xl font-serif font-bold text-center mb-12 text-green-900">
          {content.title}
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {content.items?.map((item, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full"></div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-green-900">
                {item.title}
              </h3>
              <p className="text-green-700 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {(!content.items || content.items.length === 0) && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No values configured. Add values to display them here.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export const valuesSectionBlock = {
  name: 'values_section',
  settings: {
    name: 'values_section',
    title: 'Values Section',
    icon: () => <div className="w-4 h-4 bg-green-500 rounded-full"></div>,
    category: 'text' as const,
    supports: {
      alignment: false,
      spacing: true,
      color: true,
    },
  },
  edit: ValuesSectionEdit,
  save: ValuesSectionSave,
};