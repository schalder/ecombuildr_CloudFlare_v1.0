import React, { useState, useEffect } from 'react';
import { Grid3x3, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ImageUpload } from '@/components/ui/image-upload';
import { BlockEditProps, BlockSaveProps } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/hooks/useUserStore';

interface CategoryCirclesContent {
  title: string;
  subtitle: string;
  layout: 'circles' | 'cards';
  showAll: boolean;
  selectedCategories: string[];
  customCategories: Array<{
    id: string;
    name: string;
    image: string;
    color: string;
  }>;
}

interface Category {
  id: string;
  name: string;
  image_url?: string;
  slug: string;
}

const CategoryCirclesEdit: React.FC<BlockEditProps> = ({ 
  block, 
  onUpdate, 
  onRemove, 
  onDuplicate, 
  isSelected, 
  onSelect 
}) => {
  const { store } = useUserStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const content = block.content as CategoryCirclesContent;

  useEffect(() => {
    if (store?.id) {
      fetchCategories();
    }
  }, [store?.id]);

  const fetchCategories = async () => {
    if (!store?.id) return;
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', store.id);

    if (!error && data) {
      setCategories(data);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    const selectedCategories = content.selectedCategories || [];
    const updated = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    onUpdate({ selectedCategories: updated });
  };

  const addCustomCategory = () => {
    const customCategories = content.customCategories || [];
    const newCategory = {
      id: `custom-${Date.now()}`,
      name: 'New Category',
      image: '',
      color: '#10B981'
    };
    onUpdate({ customCategories: [...customCategories, newCategory] });
  };

  const updateCustomCategory = (index: number, updates: Partial<typeof content.customCategories[0]>) => {
    const customCategories = [...(content.customCategories || [])];
    customCategories[index] = { ...customCategories[index], ...updates };
    onUpdate({ customCategories });
  };

  const removeCustomCategory = (index: number) => {
    const customCategories = [...(content.customCategories || [])];
    customCategories.splice(index, 1);
    onUpdate({ customCategories });
  };

  return (
    <div 
      className={`border-2 rounded-lg p-4 ${isSelected ? 'border-primary' : 'border-border'}`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-4 h-4" />
          <span className="font-medium">Category Navigation</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDuplicate}>
            Copy
          </Button>
          <Button variant="destructive" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Section Title</Label>
          <Input
            id="title"
            value={content.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Shop by Category"
          />
        </div>

        <div>
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={content.subtitle || ''}
            onChange={(e) => onUpdate({ subtitle: e.target.value })}
            placeholder="Browse our product categories"
          />
        </div>

        <div>
          <Label htmlFor="layout">Layout Style</Label>
          <Select value={content.layout || 'circles'} onValueChange={(value) => onUpdate({ layout: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="circles">Circular Icons</SelectItem>
              <SelectItem value="cards">Category Cards</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="showAll">Show All Categories</Label>
          <Switch
            id="showAll"
            checked={content.showAll || false}
            onCheckedChange={(checked) => onUpdate({ showAll: checked })}
          />
        </div>

        {!content.showAll && (
          <>
            <Separator />
            <div>
              <Label>Select Categories</Label>
              <div className="max-h-40 overflow-y-auto mt-2 space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`category-${category.id}`}
                      checked={content.selectedCategories?.includes(category.id) || false}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="rounded"
                    />
                    <label htmlFor={`category-${category.id}`} className="text-sm">
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Custom Categories</Label>
            <Button variant="outline" size="sm" onClick={addCustomCategory}>
              <Plus className="w-4 h-4 mr-1" />
              Add Custom
            </Button>
          </div>

          {content.customCategories?.map((customCat, index) => (
            <div key={customCat.id} className="border rounded-lg p-3 space-y-3">
              <div className="flex justify-between items-start">
                <Label>Custom Category {index + 1}</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeCustomCategory(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <Input
                value={customCat.name}
                onChange={(e) => updateCustomCategory(index, { name: e.target.value })}
                placeholder="Category name"
              />
              
              <ImageUpload
                value={customCat.image}
                onChange={(image) => updateCustomCategory(index, { image })}
                label="Category Image"
              />
              
              <div>
                <Label>Background Color</Label>
                <Input
                  type="color"
                  value={customCat.color}
                  onChange={(e) => updateCustomCategory(index, { color: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CategoryCirclesSave: React.FC<BlockSaveProps> = ({ block }) => {
  const { store } = useUserStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const content = block.content as CategoryCirclesContent;

  useEffect(() => {
    if (store?.id) {
      fetchCategories();
    }
  }, [store?.id, content]);

  const fetchCategories = async () => {
    if (!store?.id) return;
    
    setLoading(true);
    let query = supabase
      .from('categories')
      .select('*')
      .eq('store_id', store.id);

    if (!content.showAll && content.selectedCategories?.length > 0) {
      query = query.in('id', content.selectedCategories);
    }

    const { data, error } = await query;

    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  };

  // Combine regular categories with custom categories
  const allCategories = [
    ...categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      image: cat.image_url,
      color: store?.primary_color || '#10B981',
      slug: cat.slug
    })),
    ...(content.customCategories || [])
  ];

  if (loading) {
    return (
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <div className="h-8 bg-muted rounded w-64 mx-auto mb-2"></div>
            <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="w-16 h-16 bg-muted rounded-full mx-auto"></div>
                <div className="h-4 bg-muted rounded w-16 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const renderCircles = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
      {allCategories.map((category) => (
        <div key={category.id} className="text-center group cursor-pointer">
          <div 
            className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-lg"
            style={{ backgroundColor: category.color }}
          >
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-medium text-xs">
                {category.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-sm font-medium group-hover:text-primary transition-colors">
            {category.name}
          </p>
        </div>
      ))}
    </div>
  );

  const renderCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {allCategories.map((category) => (
        <div 
          key={category.id} 
          className="bg-card rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 group cursor-pointer border"
        >
          <div className="w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center overflow-hidden bg-primary/10">
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className="text-primary font-bold text-lg">
                {category.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-sm font-medium group-hover:text-primary transition-colors">
            {category.name}
          </p>
        </div>
      ))}
    </div>
  );

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        {(content.title || content.subtitle) && (
          <div className="text-center mb-8">
            {content.title && (
              <h2 className="text-3xl font-bold mb-2">{content.title}</h2>
            )}
            {content.subtitle && (
              <p className="text-muted-foreground text-lg">{content.subtitle}</p>
            )}
          </div>
        )}

        {content.layout === 'circles' ? renderCircles() : renderCards()}

        {allCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No categories found</p>
          </div>
        )}
      </div>
    </section>
  );
};

export const categoryCirclesBlock = {
  name: 'theme/category-circles',
  settings: {
    name: 'theme/category-circles',
    title: 'Category Navigation',
    icon: Grid3x3,
    category: 'store' as const,
    supports: {
      alignment: true,
      spacing: true,
      color: true,
    },
  },
  edit: CategoryCirclesEdit,
  save: CategoryCirclesSave,
};