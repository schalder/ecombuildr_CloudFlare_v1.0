import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

interface Category {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

interface FilterState {
  categories: string[];
  priceRange: [number, number];
  rating: number;
  inStock: boolean;
  onSale: boolean;
  freeShipping: boolean;
}

interface ProductFiltersProps {
  categories: Category[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  className?: string;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  filters,
  onFiltersChange,
  onClearFilters,
  className
}) => {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    rating: true,
    features: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCategoryChange = (categorySlug: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, categorySlug]
      : filters.categories.filter(c => c !== categorySlug);
    
    onFiltersChange({
      ...filters,
      categories: newCategories
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
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={filters.categories.includes(category.slug)}
                      onCheckedChange={(checked) => 
                        handleCategoryChange(category.slug, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`category-${category.id}`}
                      className="text-sm cursor-pointer hover:text-foreground transition-colors"
                    >
                      {category.name}
                    </label>
                  </div>
                  {category.count && (
                    <span className="text-xs text-muted-foreground">
                      ({category.count})
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

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
            Features
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