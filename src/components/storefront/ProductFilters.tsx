import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, Filter, X, Folder, FolderOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_category_id?: string | null;
  count?: number;
  children?: Category[];
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

interface FilterState {
  categories: string[];
  collections: string[];
  priceRange: [number, number];
  rating: number;
  inStock: boolean;
  onSale: boolean;
  freeShipping: boolean;
}

interface ProductFiltersProps {
  categories: Category[];
  collections?: Collection[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  className?: string;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  collections = [],
  filters,
  onFiltersChange,
  onClearFilters,
  className
}) => {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    collections: true,
    price: true,
    rating: true,
    features: true
  });

  // Initialize with parent categories expanded by default
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    const parentCategoryIds = categories
      .filter(cat => categories.some(c => c.parent_category_id === cat.id))
      .map(cat => cat.id);
    return new Set(parentCategoryIds);
  });

  type CategoryWithChildren = Category & { children: CategoryWithChildren[] };

  // Transform flat categories into hierarchical structure
  const hierarchicalCategories = useMemo(() => {
    const categoryMap = new Map<string, CategoryWithChildren>();
    const rootCategories: CategoryWithChildren[] = [];

    // First pass: create all categories with empty children arrays
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: organize into hierarchy
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id);
      if (!categoryWithChildren) return;

      if (category.parent_category_id) {
        const parent = categoryMap.get(category.parent_category_id);
        if (parent) {
          parent.children.push(categoryWithChildren);
        } else {
          // Parent not found, treat as root
          rootCategories.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories;
  }, [categories]);

  // Lookup maps for category nodes and parent relationships
  const { nodeBySlug, parentById } = useMemo(() => {
    const bySlug = new Map<string, CategoryWithChildren>();
    const parent = new Map<string, string | null>();

    const walk = (nodeList: CategoryWithChildren[], parentId: string | null) => {
      nodeList.forEach((node) => {
        bySlug.set(node.slug, node);
        parent.set(node.id, parentId);
        if (node.children?.length) walk(node.children, node.id);
      });
    };

    walk(hierarchicalCategories, null);
    return { nodeBySlug: bySlug, parentById: parent };
  }, [hierarchicalCategories]);

  const getAncestorIds = (id: string) => {
    const ids: string[] = [];
    let cur: string | null | undefined = id;
    while (cur) {
      const p = parentById.get(cur) ?? null;
      if (p) ids.push(p);
      cur = p;
    }
    return ids;
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const hasSubcategories = (category: CategoryWithChildren) => {
    return category.children.length > 0;
  };

  const renderCategoryTree = (categoryList: CategoryWithChildren[], level = 0): React.ReactNode => {
    return categoryList.map((category) => (
      <div key={category.id}>
        <div 
          className={cn(
            "flex items-center py-2 px-1 rounded hover:bg-muted/50 transition-colors",
            level > 0 && "ml-6"
          )}
          onClick={() => {
            if (hasSubcategories(category)) {
              toggleCategoryExpansion(category.id);
            }
          }}
        >
          <div className="flex items-center space-x-3 flex-1" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              id={`category-${category.id}`}
              checked={filters.categories.includes(category.slug)}
              onCheckedChange={(checked) => 
                handleCategoryChange(category.slug, checked as boolean)
              }
            />
            <label
              htmlFor={`category-${category.id}`}
              className={cn(
                "text-sm cursor-pointer hover:text-foreground transition-colors flex-1",
                level === 0 ? "font-medium" : "font-normal text-muted-foreground"
              )}
            >
              {category.name}
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            {category.count && (
              <span className="text-xs text-muted-foreground">
                ({category.count})
              </span>
            )}
            {hasSubcategories(category) && (
              <button className="p-1 rounded hover:bg-muted/70" onClick={(e) => { e.stopPropagation(); toggleCategoryExpansion(category.id); }} aria-label={expandedCategories.has(category.id) ? 'Collapse' : 'Expand'}>
                {expandedCategories.has(category.id) ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            )}
          </div>
        </div>
        
        {hasSubcategories(category) && expandedCategories.has(category.id) && (
          <div className="mt-1 space-y-1">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const handleCategoryChange = (categorySlug: string, checked: boolean) => {
    let newCategories: string[];
    
    if (checked) {
      newCategories = [...filters.categories, categorySlug];

      // Auto-expand selected node and its ancestors
      const node = nodeBySlug.get(categorySlug);
      if (node) {
        const ancestors = getAncestorIds(node.id);
        setExpandedCategories(prev => new Set([...prev, node.id, ...ancestors]));
      }
    } else {
      newCategories = filters.categories.filter(c => c !== categorySlug);
    }
    
    onFiltersChange({
      ...filters,
      categories: newCategories
    });
  };

  const handleCollectionChange = (collectionSlug: string, checked: boolean) => {
    const newCollections = checked
      ? [...filters.collections, collectionSlug]
      : filters.collections.filter(c => c !== collectionSlug);
    
    onFiltersChange({
      ...filters,
      collections: newCollections
    });
  };

  const handlePriceRangeChange = (value: [number, number]) => {
    onFiltersChange({
      ...filters,
      priceRange: value
    });
  };

  const handleFeatureChange = (feature: keyof FilterState, checked: boolean) => {
    onFiltersChange({
      ...filters,
      [feature]: checked
    });
  };

  const activeFiltersCount = [
    filters.categories.length > 0,
    filters.collections.length > 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 10000,
    filters.rating > 0,
    filters.inStock,
    filters.onSale,
    filters.freeShipping
  ].filter(Boolean).length;

  return (
    <Card className={cn("sticky top-24", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Separator />
        
        {/* Price Range */}
        <div>
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full text-left font-semibold mb-3"
          >
            Price Range
            {expandedSections.price ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {expandedSections.price && (
            <div className="space-y-4">
              <Slider
                value={filters.priceRange}
                onValueChange={handlePriceRangeChange}
                max={10000}
                min={0}
                step={100}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatCurrency(filters.priceRange[0])}</span>
                <span>{formatCurrency(filters.priceRange[1])}</span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Categories */}
        <div>
          <button
            onClick={() => toggleSection('categories')}
            className="flex items-center justify-between w-full text-left font-semibold mb-3"
          >
            Categories
            {expandedSections.categories ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {expandedSections.categories && (
            <div className="space-y-1">
              {renderCategoryTree(hierarchicalCategories)}
            </div>
          )}
        </div>

        <Separator />

        {/* Collections */}
        {collections.length > 0 && (
          <>
            <div>
              <button
                onClick={() => toggleSection('collections')}
                className="flex items-center justify-between w-full text-left font-semibold mb-3"
              >
                Collections
                {expandedSections.collections ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {expandedSections.collections && (
                <div className="space-y-3">
                  {collections.map((collection) => (
                    <div key={collection.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`collection-${collection.id}`}
                          checked={filters.collections.includes(collection.slug)}
                          onCheckedChange={(checked) => 
                            handleCollectionChange(collection.slug, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`collection-${collection.id}`}
                          className="text-sm cursor-pointer hover:text-foreground transition-colors"
                        >
                          {collection.name}
                        </label>
                      </div>
                      {collection.count && (
                        <span className="text-xs text-muted-foreground">
                          ({collection.count})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        <Separator />

        {/* Rating */}
        <div>
          <button
            onClick={() => toggleSection('rating')}
            className="flex items-center justify-between w-full text-left font-semibold mb-3"
          >
            Customer Rating
            {expandedSections.rating ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {expandedSections.rating && (
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <Checkbox
                    id={`rating-${rating}`}
                    checked={filters.rating >= rating}
                    onCheckedChange={(checked) =>
                      onFiltersChange({
                        ...filters,
                        rating: checked ? rating : 0
                      })
                    }
                  />
                  <label
                    htmlFor={`rating-${rating}`}
                    className="text-sm cursor-pointer flex items-center gap-1"
                  >
                    <span className="text-yellow-400">
                      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                    </span>
                    <span className="text-muted-foreground">& up</span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Features */}
        <div>
          <button
            onClick={() => toggleSection('features')}
            className="flex items-center justify-between w-full text-left font-semibold mb-3"
          >
            Availability
            {expandedSections.features ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {expandedSections.features && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="in-stock"
                  checked={filters.inStock}
                  onCheckedChange={(checked) => 
                    handleFeatureChange('inStock', checked as boolean)
                  }
                />
                <label htmlFor="in-stock" className="text-sm cursor-pointer">
                  In Stock Only
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="on-sale"
                  checked={filters.onSale}
                  onCheckedChange={(checked) => 
                    handleFeatureChange('onSale', checked as boolean)
                  }
                />
                <label htmlFor="on-sale" className="text-sm cursor-pointer">
                  On Sale
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="free-shipping"
                  checked={filters.freeShipping}
                  onCheckedChange={(checked) => 
                    handleFeatureChange('freeShipping', checked as boolean)
                  }
                />
                <label htmlFor="free-shipping" className="text-sm cursor-pointer">
                  Free Shipping
                </label>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};