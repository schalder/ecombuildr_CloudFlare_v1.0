import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useStoreProducts, useStoreCategories } from '@/hooks/useStoreData';
import { PageBuilderElement } from '../types';
import { Trash2 } from 'lucide-react';

interface EcommerceContentPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

export const EcommerceContentProperties: React.FC<EcommerceContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const { categories } = useStoreCategories();
  const { products } = useStoreProducts();

  const selectionMode = element.content.selectionMode || 'all';
  const categoryIds = element.content.categoryIds || [];
  const specificProductIds = element.content.specificProductIds || [];

  const handleCategoryToggle = (categoryId: string) => {
    const updatedIds = categoryIds.includes(categoryId)
      ? categoryIds.filter((id: string) => id !== categoryId)
      : [...categoryIds, categoryId];
    onUpdate('categoryIds', updatedIds);
  };

  const handleProductToggle = (productId: string) => {
    const updatedIds = specificProductIds.includes(productId)
      ? specificProductIds.filter((id: string) => id !== productId)
      : [...specificProductIds, productId];
    onUpdate('specificProductIds', updatedIds);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Title</Label>
        <Input
          value={element.content.title || ''}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Our Products"
        />
      </div>

      <div>
        <Label className="text-xs">Grid Columns</Label>
        <Select
          value={element.content.columns?.toString() || '2'}
          onValueChange={(value) => onUpdate('columns', parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Column</SelectItem>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
            <SelectItem value="6">6 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Product Limit</Label>
        <div className="space-y-2">
          <Slider
            value={[element.content.limit || 4]}
            onValueChange={(value) => onUpdate('limit', value[0])}
            max={50}
            min={1}
            step={1}
          />
          <span className="text-xs text-muted-foreground">
            {element.content.limit || 4} products
          </span>
        </div>
      </div>

      <div>
        <Label className="text-xs">Product Selection</Label>
        <Select
          value={selectionMode}
          onValueChange={(value) => onUpdate('selectionMode', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="category">By Category</SelectItem>
            <SelectItem value="specific">Specific Products</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectionMode === 'category' && (
        <div>
          <Label className="text-xs">Select Categories</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={categoryIds.includes(category.id)}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                />
                <Label className="text-xs">{category.name}</Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectionMode === 'specific' && (
        <div>
          <Label className="text-xs">Select Products</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {products.map((product) => (
              <div key={product.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={specificProductIds.includes(product.id)}
                  onCheckedChange={() => handleProductToggle(product.id)}
                />
                <div className="flex items-center gap-2 flex-1">
                  <img 
                    src={(Array.isArray(product.images) ? product.images[0] : product.images) || '/placeholder.svg'}
                    alt={product.name}
                    className="w-6 h-6 rounded object-cover"
                  />
                  <Label className="text-xs flex-1">{product.name}</Label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={element.content.showRating !== false}
            onCheckedChange={(checked) => onUpdate('showRating', checked)}
          />
          <Label className="text-xs">Show Ratings</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={element.content.showPrice !== false}
            onCheckedChange={(checked) => onUpdate('showPrice', checked)}
          />
          <Label className="text-xs">Show Price</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={element.content.showQuickAdd !== false}
            onCheckedChange={(checked) => onUpdate('showQuickAdd', checked)}
          />
          <Label className="text-xs">Show Quick Add Button</Label>
        </div>
      </div>
    </div>
  );
};

export const FeaturedProductsContentProperties: React.FC<EcommerceContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const { products } = useStoreProducts();

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Select Product</Label>
        <Select
          value={element.content.productId || ''}
          onValueChange={(value) => onUpdate('productId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                <div className="flex items-center gap-2">
                  <img 
                    src={(Array.isArray(product.images) ? product.images[0] : product.images) || '/placeholder.svg'}
                    alt={product.name}
                    className="w-6 h-6 rounded object-cover"
                  />
                  {product.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Layout</Label>
        <Select
          value={element.content.layout || 'horizontal'}
          onValueChange={(value) => onUpdate('layout', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="horizontal">Horizontal</SelectItem>
            <SelectItem value="vertical">Vertical</SelectItem>
            <SelectItem value="hero">Hero</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Badge Text</Label>
        <Input
          value={element.content.badgeText || ''}
          onChange={(e) => onUpdate('badgeText', e.target.value)}
          placeholder="Featured Product"
        />
      </div>

      <div>
        <Label className="text-xs">Call to Action Text</Label>
        <Input
          value={element.content.ctaText || ''}
          onChange={(e) => onUpdate('ctaText', e.target.value)}
          placeholder="Add to Cart"
        />
      </div>
    </div>
  );
};

export const ProductCategoriesContentProperties: React.FC<EcommerceContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const { categories } = useStoreCategories();
  const selectedCategoryIds = element.content.selectedCategoryIds || [];

  const handleCategoryToggle = (categoryId: string) => {
    const updatedIds = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((id: string) => id !== categoryId)
      : [...selectedCategoryIds, categoryId];
    onUpdate('selectedCategoryIds', updatedIds);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Title</Label>
        <Input
          value={element.content.title || ''}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Shop by Category"
        />
      </div>

      <div>
        <Label className="text-xs">Layout</Label>
        <Select
          value={element.content.layout || 'grid'}
          onValueChange={(value) => onUpdate('layout', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid Cards</SelectItem>
            <SelectItem value="circles">Circles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Categories to Display</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Leave empty to show all categories
        </p>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                checked={selectedCategoryIds.includes(category.id)}
                onCheckedChange={() => handleCategoryToggle(category.id)}
              />
              <Label className="text-xs">{category.name}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={element.content.showProductCount !== false}
            onCheckedChange={(checked) => onUpdate('showProductCount', checked)}
          />
          <Label className="text-xs">Show Product Count</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={element.content.enableLinks !== false}
            onCheckedChange={(checked) => onUpdate('enableLinks', checked)}
          />
          <Label className="text-xs">Enable Category Links</Label>
        </div>
      </div>
    </div>
  );
};

export const PriceContentProperties: React.FC<EcommerceContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const { products } = useStoreProducts();

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Select Product</Label>
        <Select
          value={element.content.productId || ''}
          onValueChange={(value) => onUpdate('productId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                <div className="flex items-center gap-2">
                  <img 
                    src={(Array.isArray(product.images) ? product.images[0] : product.images) || '/placeholder.svg'} 
                    alt={product.name}
                    className="w-6 h-6 rounded object-cover"
                  />
                  {product.name} - ${product.price}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Layout</Label>
        <Select
          value={element.content.layout || 'horizontal'}
          onValueChange={(value) => onUpdate('layout', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="horizontal">Horizontal</SelectItem>
            <SelectItem value="vertical">Vertical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Call to Action Text</Label>
        <Input
          value={element.content.ctaText || ''}
          onChange={(e) => onUpdate('ctaText', e.target.value)}
          placeholder="Buy Now"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={element.content.showComparePrice !== false}
            onCheckedChange={(checked) => onUpdate('showComparePrice', checked)}
          />
          <Label className="text-xs">Show Compare Price</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={element.content.showDiscount !== false}
            onCheckedChange={(checked) => onUpdate('showDiscount', checked)}
          />
          <Label className="text-xs">Show Discount Badge</Label>
        </div>
      </div>
    </div>
  );
};