import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Package, Folder, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_category_id?: string;
  level: number;
  full_path: string;
  children?: Category[];
}

interface CategoryTreeSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  storeId: string;
  websiteId?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function CategoryTreeSelect({
  value,
  onValueChange,
  storeId,
  websiteId,
  disabled = false,
  placeholder = "Select a category"
}: CategoryTreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Get selected category details for display
  const selectedCategory = categories.find(cat => cat.id === value);

  // Fetch hierarchical categories
  useEffect(() => {
    if (!storeId) return;
    
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('get_category_hierarchy', { store_uuid: storeId });

        if (error) throw error;

        const hierarchicalCategories = buildCategoryTree(data || []);
        setCategories(hierarchicalCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [storeId]);

  // Filter categories by website visibility
  useEffect(() => {
    if (!websiteId) {
      setFilteredCategories([]);
      return;
    }

    const filterByWebsite = async () => {
      try {
        const { data: visibilityData } = await supabase
          .from('category_website_visibility')
          .select('category_id')
          .eq('website_id', websiteId);

        const visibleCategoryIds = new Set(visibilityData?.map(v => v.category_id) || []);
        
        // Filter categories and maintain hierarchy
        const filtered = filterCategoriesWithChildren(categories, visibleCategoryIds);
        setFilteredCategories(filtered);
      } catch (error) {
        console.error('Error filtering categories by website:', error);
        setFilteredCategories([]);
      }
    };

    filterByWebsite();
  }, [websiteId, categories]);

  // Build tree structure from flat data
  const buildCategoryTree = (flatCategories: any[]): Category[] => {
    const categoryMap = new Map();
    const rootCategories: Category[] = [];

    // First pass: create all categories
    flatCategories.forEach(cat => {
      categoryMap.set(cat.id, {
        ...cat,
        children: []
      });
    });

    // Second pass: build hierarchy
    flatCategories.forEach(cat => {
      if (cat.parent_category_id) {
        const parent = categoryMap.get(cat.parent_category_id);
        const child = categoryMap.get(cat.id);
        if (parent && child) {
          parent.children.push(child);
        }
      } else {
        rootCategories.push(categoryMap.get(cat.id));
      }
    });

    return rootCategories;
  };

  // Filter categories while preserving parent-child relationships
  const filterCategoriesWithChildren = (categories: Category[], visibleIds: Set<string>): Category[] => {
    const filtered: Category[] = [];

    const processCategory = (category: Category): Category | null => {
      const isVisible = visibleIds.has(category.id);
      const filteredChildren = category.children?.map(processCategory).filter(Boolean) as Category[] || [];
      
      // Include category if it's visible OR has visible children
      if (isVisible || filteredChildren.length > 0) {
        return {
          ...category,
          children: filteredChildren
        };
      }
      
      return null;
    };

    categories.forEach(category => {
      const processedCategory = processCategory(category);
      if (processedCategory) {
        filtered.push(processedCategory);
      }
    });

    return filtered;
  };

  // Search functionality
  const searchCategories = (categories: Category[], term: string): Category[] => {
    if (!term) return categories;

    const matches: Category[] = [];
    
    const searchInCategory = (category: Category): boolean => {
      const nameMatch = category.name.toLowerCase().includes(term.toLowerCase());
      const pathMatch = category.full_path.toLowerCase().includes(term.toLowerCase());
      
      // Check children
      const childMatches = category.children?.some(searchInCategory) || false;
      
      if (nameMatch || pathMatch || childMatches) {
        matches.push({
          ...category,
          children: category.children?.filter(child => searchInCategory(child)) || []
        });
        return true;
      }
      
      return false;
    };

    categories.forEach(category => {
      searchInCategory(category);
    });

    return matches;
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategory = (category: Category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = value === category.id;

    return (
      <div key={category.id} className="space-y-1">
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent/50 transition-colors",
            isSelected && "bg-accent text-accent-foreground",
            "text-sm"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={(e) => {
            e.stopPropagation();
            console.log('Category selected:', category.id, category.name);
            onValueChange(category.id);
            setOpen(false);
          }}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0.5 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(category.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <div className="w-4" />
          )}
          
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-amber-500" />
            ) : (
              <Folder className="h-4 w-4 text-amber-500" />
            )
          ) : (
            <Package className="h-4 w-4 text-blue-500" />
          )}
          
          <span className="flex-1 truncate">{category.name}</span>
          
          {level > 0 && (
            <Badge variant="outline" className="text-xs">
              Level {level + 1}
            </Badge>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {category.children?.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const displayCategories = searchTerm
    ? searchCategories(filteredCategories, searchTerm)
    : filteredCategories;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled}
          >
            {selectedCategory ? (
              <div className="flex items-center gap-2 truncate">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="truncate">{selectedCategory.full_path}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="flex flex-col h-[300px]">
            {/* Header */}
            <div className="p-3 border-b">
              <div className="space-y-2">
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8"
                />
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {displayCategories.length} categor{displayCategories.length === 1 ? 'y' : 'ies'}
                    {websiteId ? ' (filtered by website)' : ''}
                  </span>
                  
                  {displayCategories.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-xs"
                      onClick={() => {
                        const allIds = new Set<string>();
                        const collectIds = (cats: Category[]) => {
                          cats.forEach(cat => {
                            if (cat.children?.length) {
                              allIds.add(cat.id);
                              collectIds(cat.children);
                            }
                          });
                        };
                        collectIds(displayCategories);
                        setExpandedCategories(
                          expandedCategories.size === allIds.size ? new Set() : allIds
                        );
                      }}
                    >
                      {expandedCategories.size > 0 ? 'Collapse All' : 'Expand All'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading categories...
                </div>
              ) : displayCategories.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {websiteId ? 'No categories available for this website' : 'No categories found'}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {/* No Category option */}
                  <div
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent/50 transition-colors",
                      !value && "bg-accent text-accent-foreground",
                      "text-sm border-b mb-2 pb-2"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('No category selected');
                      onValueChange('');
                      setOpen(false);
                    }}
                  >
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="italic text-muted-foreground">No category</span>
                  </div>
                  
                  {displayCategories.map(category => renderCategory(category))}
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedCategory && (
              <>
                <Separator />
                <div className="p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground">
                    <div className="font-medium">Selected:</div>
                    <div className="truncate">{selectedCategory.full_path}</div>
                    {selectedCategory.description && (
                      <div className="mt-1 text-muted-foreground">
                        {selectedCategory.description}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      {!websiteId && (
        <p className="text-xs text-muted-foreground">
          Select a website first to see available categories
        </p>
      )}
    </div>
  );
}