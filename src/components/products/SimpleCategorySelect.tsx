import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/hooks/useCategories";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_category_id?: string;
  store_id: string;
  created_at: string;
}

interface SimpleCategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  storeId: string;
  websiteId: string;
  disabled?: boolean;
  placeholder?: string;
}

export function SimpleCategorySelect({
  value,
  onValueChange,
  storeId,
  websiteId,
  disabled = false,
  placeholder = "Select a category"
}: SimpleCategorySelectProps) {
  const { flatCategories } = useCategories(storeId);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');

  // Filter categories by website visibility
  useEffect(() => {
    if (!flatCategories || !websiteId) {
      setFilteredCategories([]);
      return;
    }

    // Filter categories that are visible on the selected website
    // This uses the same logic as the original CategoryTreeSelect
    const filtered = flatCategories.filter((category: Category) => {
      // For now, we'll include all categories since the website filtering
      // logic is handled in the useCategories hook
      return true;
    });

    setFilteredCategories(filtered);
  }, [flatCategories, websiteId]);

  // Separate main categories and subcategories
  // Always include the selected category even if it's not in filteredCategories
  useEffect(() => {
    if (!filteredCategories.length && !value) {
      setMainCategories([]);
      setSubCategories([]);
      return;
    }

    // Start with filtered categories
    let categoriesToUse = [...filteredCategories];
    
    // If we have a value (selected category), ensure it's included even if filtered out
    if (value && flatCategories.length > 0) {
      const selectedCategory = flatCategories.find(cat => cat.id === value);
      if (selectedCategory && !categoriesToUse.find(cat => cat.id === value)) {
        // Selected category not in filtered list, add it
        categoriesToUse.push(selectedCategory);
        
        // If it's a subcategory, also ensure its parent is included
        if (selectedCategory.parent_category_id) {
          const parentCategory = flatCategories.find(cat => cat.id === selectedCategory.parent_category_id);
          if (parentCategory && !categoriesToUse.find(cat => cat.id === parentCategory.id)) {
            categoriesToUse.push(parentCategory);
          }
        }
      }
    }

    const main = categoriesToUse.filter(cat => !cat.parent_category_id);
    const sub = categoriesToUse.filter(cat => cat.parent_category_id);

    setMainCategories(main);
    setSubCategories(sub);
  }, [filteredCategories, value, flatCategories]);

  // Update selected categories when value changes
  useEffect(() => {
    // Wait for categories to load before processing value
    if (!flatCategories || flatCategories.length === 0) {
      // Categories not loaded yet, clear selections
      if (value) {
        // Value exists but categories not loaded - wait for them
        return;
      }
      setSelectedMainCategory('');
      setSelectedSubCategory('');
      return;
    }

    if (!value) {
      setSelectedMainCategory('');
      setSelectedSubCategory('');
      return;
    }

    // Use flatCategories to find the category (includes all categories, not just filtered)
    const selectedCategory = flatCategories.find(cat => cat.id === value);
    
    if (!selectedCategory) {
      console.warn('SimpleCategorySelect: Category not found in flatCategories:', {
        categoryId: value,
        availableCategories: flatCategories.length,
        categoryIds: flatCategories.map(c => c.id).slice(0, 5)
      });
      // Don't clear selections if category not found - might be a timing issue
      // The category might exist but not be in the filtered list yet
      return;
    }

    // Determine if this is a main category or subcategory
    if (selectedCategory.parent_category_id) {
      // This is a subcategory - set both main and sub
      setSelectedMainCategory(selectedCategory.parent_category_id);
      setSelectedSubCategory(value);
    } else {
      // This is a main category
      setSelectedMainCategory(value);
      setSelectedSubCategory('');
    }
  }, [value, flatCategories]); // Depend on flatCategories to ensure we have all categories

  const handleMainCategoryChange = (categoryId: string) => {
    if (categoryId === 'none') {
      // No category selected
      setSelectedMainCategory('');
      setSelectedSubCategory('');
      onValueChange('');
      return;
    }

    setSelectedMainCategory(categoryId);
    setSelectedSubCategory('');
    
    // Check if this category has subcategories
    const hasSubCategories = subCategories.some(sub => sub.parent_category_id === categoryId);
    
    if (!hasSubCategories) {
      // No subcategories, select the main category
      onValueChange(categoryId);
    } else {
      // Has subcategories: default to main category selection (subcategory optional)
      onValueChange(categoryId);
    }
  };

  const handleSubCategoryChange = (categoryId: string) => {
    if (categoryId === 'none-sub') {
      // Use main category instead
      setSelectedSubCategory('');
      onValueChange(selectedMainCategory);
      return;
    }
    
    setSelectedSubCategory(categoryId);
    onValueChange(categoryId);
  };

  const availableSubCategories = subCategories.filter(
    sub => sub.parent_category_id === selectedMainCategory
  );

  const selectedMainCategoryName = mainCategories.find(cat => cat.id === selectedMainCategory)?.name || '';
  const showSubCategoryDropdown = selectedMainCategory && availableSubCategories.length > 0;

  return (
    <div className="space-y-4">
      {/* Main Category Selection */}
      <div className="space-y-2">
        <Label>Main Category</Label>
        <Select 
          value={selectedMainCategory || 'none'} 
          onValueChange={handleMainCategoryChange}
          disabled={disabled || !websiteId}
        >
          <SelectTrigger>
            <SelectValue placeholder={disabled ? placeholder : "Select main category"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No category</SelectItem>
            {mainCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
                {subCategories.some(sub => sub.parent_category_id === category.id) && 
                  " (has subcategories)"
                }
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sub Category Selection */}
      {showSubCategoryDropdown && (
        <div className="space-y-2">
          <Label>Subcategory of "{selectedMainCategoryName}"</Label>
          <Select 
            value={selectedSubCategory || 'none-sub'} 
            onValueChange={handleSubCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subcategory (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none-sub">No subcategory (use main category)</SelectItem>
              {availableSubCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}