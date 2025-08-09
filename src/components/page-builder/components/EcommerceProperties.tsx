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
        <Label className="text-xs">Tablet Columns</Label>
        <Select
          value={element.content.tabletColumns?.toString() || 'auto'}
          onValueChange={(value) => value === 'auto' ? onUpdate('tabletColumns', undefined) : onUpdate('tabletColumns', parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Auto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto</SelectItem>
            <SelectItem value="1">1 Column</SelectItem>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
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
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={element.content.showQuickView !== false}
            onCheckedChange={(checked) => onUpdate('showQuickView', checked)}
          />
          <Label className="text-xs">Show Quick View Button</Label>
        </div>
      </div>

      <div>
        <Label className="text-xs">CTA Behavior</Label>
        <Select
          value={element.content.ctaBehavior || 'add_to_cart'}
          onValueChange={(value) => onUpdate('ctaBehavior', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add_to_cart">Add to Cart</SelectItem>
            <SelectItem value="buy_now">Buy Now</SelectItem>
          </SelectContent>
        </Select>
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
        <Label className="text-xs">Filter by Categories</Label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {(useStoreCategories().categories || []).map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                checked={(element.content.filterCategoryIds || []).includes(category.id)}
                onCheckedChange={() => {
                  const current = element.content.filterCategoryIds || [];
                  const updated = current.includes(category.id)
                    ? current.filter((id: string) => id !== category.id)
                    : [...current, category.id];
                  onUpdate('filterCategoryIds', updated);
                }}
              />
              <Label className="text-xs">{category.name}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs">Select Products to Feature</Label>
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {(
            (() => {
              const cats = element.content.filterCategoryIds || [];
              const list = cats.length
                ? products.filter((p: any) => cats.includes(p.category_id))
                : products;
              return list;
            })()
          ).map((product) => (
            <div key={product.id} className="flex items-center space-x-2">
              <Checkbox
                checked={(element.content.selectedProductIds || []).includes(product.id)}
                onCheckedChange={() => {
                  const current = element.content.selectedProductIds || [];
                  const updated = current.includes(product.id)
                    ? current.filter((id: string) => id !== product.id)
                    : [...current, product.id];
                  onUpdate('selectedProductIds', updated);
                }}
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
        <p className="text-2xs text-muted-foreground mt-1">Tip: If you leave selection empty, legacy single-product setting will be used.</p>
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
        <Label className="text-xs">Tablet Columns</Label>
        <Select
          value={element.content.tabletColumns?.toString() || 'auto'}
          onValueChange={(value) => value === 'auto' ? onUpdate('tabletColumns', undefined) : onUpdate('tabletColumns', parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Auto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto</SelectItem>
            <SelectItem value="1">1 Column</SelectItem>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
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
      <div>
        <Label className="text-xs">CTA Behavior</Label>
        <Select
          value={element.content.ctaBehavior || 'add_to_cart'}
          onValueChange={(value) => onUpdate('ctaBehavior', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add_to_cart">Add to Cart</SelectItem>
            <SelectItem value="buy_now">Buy Now</SelectItem>
          </SelectContent>
        </Select>
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

// Form Elements Properties
export const ContactFormContentProperties: React.FC<EcommerceContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const { products } = useStoreProducts();

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Form Title</Label>
        <Input
          value={element.content.title || ''}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Contact Us"
        />
      </div>

      <div>
        <Label className="text-xs">Description</Label>
        <Input
          value={element.content.description || ''}
          onChange={(e) => onUpdate('description', e.target.value)}
          placeholder="Get in touch with us"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={element.content.showPhone !== false}
            onCheckedChange={(checked) => onUpdate('showPhone', checked)}
          />
          <Label className="text-xs">Show Phone Field</Label>
        </div>
      </div>

      <div>
        <Label className="text-xs">Button Text</Label>
        <Input
          value={element.content.buttonText || ''}
          onChange={(e) => onUpdate('buttonText', e.target.value)}
          placeholder="Send Message"
        />
      </div>

      <div>
        <Label className="text-xs">Success Message</Label>
        <Input
          value={element.content.successMessage || ''}
          onChange={(e) => onUpdate('successMessage', e.target.value)}
          placeholder="Form submitted successfully!"
        />
      </div>

      <div>
        <Label className="text-xs">Product Reference (Optional)</Label>
        <Select
          value={element.content.productId || 'none'}
          onValueChange={(value) => onUpdate('productId', value === 'none' ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="No product reference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No product reference</SelectItem>
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

      <div className="space-y-2">
        <h4 className="text-xs font-medium">Field Placeholders</h4>
        <div className="space-y-1">
          <Input
            value={element.content.namePlaceholder || ''}
            onChange={(e) => onUpdate('namePlaceholder', e.target.value)}
            placeholder="Name placeholder"
            className="text-xs"
          />
          <Input
            value={element.content.emailPlaceholder || ''}
            onChange={(e) => onUpdate('emailPlaceholder', e.target.value)}
            placeholder="Email placeholder"
            className="text-xs"
          />
          <Input
            value={element.content.phonePlaceholder || ''}
            onChange={(e) => onUpdate('phonePlaceholder', e.target.value)}
            placeholder="Phone placeholder"
            className="text-xs"
          />
          <Input
            value={element.content.messagePlaceholder || ''}
            onChange={(e) => onUpdate('messagePlaceholder', e.target.value)}
            placeholder="Message placeholder"
            className="text-xs"
          />
        </div>
      </div>
    </div>
  );
};

export const NewsletterContentProperties: React.FC<EcommerceContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Title</Label>
        <Input
          value={element.content.title || ''}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Subscribe to Newsletter"
        />
      </div>

      <div>
        <Label className="text-xs">Description</Label>
        <Input
          value={element.content.description || ''}
          onChange={(e) => onUpdate('description', e.target.value)}
          placeholder="Get the latest updates and news delivered to your inbox."
        />
      </div>

      <div>
        <Label className="text-xs">Email Placeholder</Label>
        <Input
          value={element.content.emailPlaceholder || ''}
          onChange={(e) => onUpdate('emailPlaceholder', e.target.value)}
          placeholder="Enter your email"
        />
      </div>

      <div>
        <Label className="text-xs">Button Text</Label>
        <Input
          value={element.content.buttonText || ''}
          onChange={(e) => onUpdate('buttonText', e.target.value)}
          placeholder="Subscribe"
        />
      </div>

      <div>
        <Label className="text-xs">Success Message</Label>
        <Input
          value={element.content.successMessage || ''}
          onChange={(e) => onUpdate('successMessage', e.target.value)}
          placeholder="Successfully subscribed to newsletter!"
        />
      </div>
    </div>
  );
};

// Products Page Properties
export const ProductsPageContentProperties: React.FC<EcommerceContentPropertiesProps> = ({ element, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Title</Label>
        <Input
          value={element.content.title || ''}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Products"
        />
      </div>

      <div>
        <Label className="text-xs">Subtitle</Label>
        <Input
          value={element.content.subtitle || ''}
          onChange={(e) => onUpdate('subtitle', e.target.value)}
          placeholder="Discover our amazing collection of products"
        />
      </div>

      <div>
        <Label className="text-xs">Grid Columns</Label>
        <Select
          value={element.content.columns?.toString() || '4'}
          onValueChange={(v) => onUpdate('columns', parseInt(v))}
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
        <Label className="text-xs">Tablet Columns</Label>
        <Select
          value={element.content.tabletColumns?.toString() || 'auto'}
          onValueChange={(value) => value === 'auto' ? onUpdate('tabletColumns', undefined) : onUpdate('tabletColumns', parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Auto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto</SelectItem>
            <SelectItem value="1">1 Column</SelectItem>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={element.content.showSearch !== false}
              onCheckedChange={(checked) => onUpdate('showSearch', checked)}
            />
            <Label className="text-xs">Show Search</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={element.content.showFilters !== false}
              onCheckedChange={(checked) => onUpdate('showFilters', checked)}
            />
            <Label className="text-xs">Show Filters</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={element.content.showRecentlyViewed !== false}
              onCheckedChange={(checked) => onUpdate('showRecentlyViewed', checked)}
            />
            <Label className="text-xs">Show Recently Viewed</Label>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={element.content.showSort !== false}
              onCheckedChange={(checked) => onUpdate('showSort', checked)}
            />
            <Label className="text-xs">Show Sort</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={element.content.showViewToggle !== false}
              onCheckedChange={(checked) => onUpdate('showViewToggle', checked)}
            />
            <Label className="text-xs">Show View Toggle</Label>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs">Default Sort</Label>
        <Select
          value={element.content.defaultSortBy || 'name'}
          onValueChange={(v) => onUpdate('defaultSortBy', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Default View</Label>
        <Select
          value={element.content.defaultViewMode || 'grid'}
          onValueChange={(v) => onUpdate('defaultViewMode', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid</SelectItem>
            <SelectItem value="list">List</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Default Price Range</Label>
        <div className="space-y-2">
          <Slider
            value={element.content.priceRange || [0, 10000]}
            onValueChange={(value) => onUpdate('priceRange', value as [number, number])}
            max={10000}
            min={0}
            step={100}
          />
          <span className="text-xs text-muted-foreground">
            ৳{(element.content.priceRange || [0, 10000])[0]} - ৳{(element.content.priceRange || [0, 10000])[1]}
          </span>
        </div>
      </div>
    </div>
  );
};
