import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BlockEditProps, BlockSaveProps } from '../types';
import { Settings, Trash2, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';

interface CategoryShowcaseContent {
  title: string;
  layout: 'grid' | 'organic';
  showDescription: boolean;
  selectedCategories?: string[];
}

interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  slug: string;
}

export const CategoryShowcaseEdit: React.FC<BlockEditProps> = ({ 
  block, 
  onUpdate, 
  onRemove, 
  onDuplicate, 
  isSelected, 
  onSelect 
}) => {
  const content = block.content as CategoryShowcaseContent;
  const { store } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (store?.id) {
      fetchCategories();
    }
  }, [store?.id]);

  const fetchCategories = async () => {
    if (!store?.id) return;

    const { data } = await supabase
      .from('categories')
      .select('id, name, description, image_url, slug')
      .eq('store_id', store.id)
      .order('name');

    if (data) {
      setCategories(data);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const selected = content.selectedCategories || [];
    const newSelected = selected.includes(categoryId)
      ? selected.filter(id => id !== categoryId)
      : [...selected, categoryId];
    
    onUpdate({ selectedCategories: newSelected });
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
          <span className="text-sm font-medium">Category Showcase</span>
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
                placeholder="Shop by Category"
              />
            </div>

            <div>
              <Label htmlFor="layout">Layout Style</Label>
              <Select value={content.layout} onValueChange={(value) => onUpdate({ layout: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="organic">Organic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Categories</Label>
              <div className="max-h-48 overflow-y-auto space-y-2 mt-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={content.selectedCategories?.includes(category.id) || false}
                      onChange={() => toggleCategory(category.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{category.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      <CategoryShowcaseSave block={block} />
    </div>
  );
};

export const CategoryShowcaseSave: React.FC<BlockSaveProps> = ({ block }) => {
  const content = block.content as CategoryShowcaseContent;
  const { store } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (store?.id) {
      fetchCategories();
    }
  }, [store?.id, content.selectedCategories]);

  const fetchCategories = async () => {
    if (!store?.id) return;

    let query = supabase
      .from('categories')
      .select('id, name, description, image_url, slug')
      .eq('store_id', store.id);

    if (content.selectedCategories?.length) {
      query = query.in('id', content.selectedCategories);
    }

    const { data } = await query.order('name');

    if (data) {
      setCategories(data);
    }
  };

  const gridClass = content.layout === 'organic' 
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
    : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6';

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <h2 className={`text-3xl font-bold text-center mb-12 ${
          content.layout === 'organic' ? 'font-serif text-green-900' : 'text-foreground'
        }`}>
          {content.title}
        </h2>
        
        <div className={gridClass}>
          {categories.map((category) => (
            <div 
              key={category.id} 
              className={`group cursor-pointer ${
                content.layout === 'organic' 
                  ? 'bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all p-6' 
                  : 'bg-background rounded-lg border hover:border-primary transition-all p-4'
              }`}
            >
              <div className={`aspect-square mb-4 rounded-lg bg-gradient-to-br ${
                content.layout === 'organic' 
                  ? 'from-green-100 to-emerald-200' 
                  : 'from-primary/10 to-accent/10'
              } flex items-center justify-center`}>
                {category.image_url ? (
                  <img 
                    src={category.image_url} 
                    alt={category.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className={`text-center ${
                    content.layout === 'organic' ? 'text-green-600' : 'text-primary'
                  }`}>
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-full ${
                      content.layout === 'organic' ? 'bg-green-600' : 'bg-primary'
                    }`}></div>
                    <span className="text-sm">Category</span>
                  </div>
                )}
              </div>
              
              <h3 className={`font-semibold text-lg mb-2 ${
                content.layout === 'organic' ? 'text-green-900' : 'text-foreground'
              }`}>
                {category.name}
              </h3>
              
              {content.showDescription && category.description && (
                <p className="text-muted-foreground text-sm">
                  {category.description}
                </p>
              )}
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No categories selected. Configure this section to display your product categories.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export const categoryShowcaseBlock = {
  name: 'category_showcase',
  settings: {
    name: 'category_showcase',
    title: 'Category Showcase',
    icon: () => <div className="w-4 h-4 bg-purple-500 rounded"></div>,
    category: 'store' as const,
    supports: {
      alignment: false,
      spacing: true,
      color: false,
    },
  },
  edit: CategoryShowcaseEdit,
  save: CategoryShowcaseSave,
};