import { useState, useEffect, useMemo, useRef } from "react";
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
  
  // Stabilize flatCategories length to prevent infinite loops
  const flatCategoriesLength = useMemo(() => flatCategories?.length || 0, [flatCategories?.length]);
  
  // Track if we've already processed the current value to prevent loops
  const processedValueRef = useRef<string>('');
  const processedCategoriesRef = useRef<number>(0);
  
  // Track previous value to detect when it changes from empty to non-empty
  const previousValueRef = useRef<string>('');
  
  // Track if we're setting value programmatically (from props) vs user interaction
  const isSettingProgrammaticallyRef = useRef<boolean>(false);

  // Debug logging - only log when meaningful values change
  useEffect(() => {
    console.log('📂 SimpleCategorySelect - Props changed:', {
      value,
      storeId,
      websiteId,
      flatCategoriesCount: flatCategoriesLength,
      selectedMainCategory,
      selectedSubCategory
    });
  }, [value, storeId, websiteId, flatCategoriesLength, selectedMainCategory, selectedSubCategory]);

  // Filter categories by website visibility
  useEffect(() => {
    if (!flatCategories || flatCategories.length === 0 || !websiteId) {
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
    // Wait for storeId to be available
    if (!storeId) {
      setMainCategories([]);
      setSubCategories([]);
      return;
    }

    // Wait for categories to load
    if (!flatCategories || flatCategories.length === 0) {
      if (!value) {
        // No value and no categories - clear everything
        setMainCategories([]);
        setSubCategories([]);
      }
      // If we have a value but no categories yet, wait (don't clear)
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
  }, [filteredCategories, value, flatCategories, storeId]);

  // Update selected categories when value changes
  // Use refs to prevent processing the same value/categories combination multiple times
  useEffect(() => {
    // Wait for storeId to be available (required for useCategories to work)
    if (!storeId) {
      return;
    }

    // Wait for categories to load before processing value
    if (!flatCategories || flatCategories.length === 0) {
      // Categories not loaded yet
      if (value) {
        // Value exists but categories not loaded - wait for them
        return;
      }
      // No value and no categories - clear selections only once
      if (processedValueRef.current !== '' || processedCategoriesRef.current !== 0) {
        processedValueRef.current = '';
        processedCategoriesRef.current = 0;
        setSelectedMainCategory('');
        setSelectedSubCategory('');
      }
      return;
    }

    // Check if we've already processed this exact combination
    const categoriesHash = flatCategories.length;
    
    // IMPORTANT: If value changed from empty to non-empty, or vice versa, we need to re-process
    // Also re-process if categories count changed (categories were reloaded)
    const valueChanged = previousValueRef.current !== value;
    const categoriesChanged = processedCategoriesRef.current !== categoriesHash;
    const wasEmptyNowHasValue = !previousValueRef.current && value;
    
    // Update previous value ref
    previousValueRef.current = value;
    
    // If value changed from empty to non-empty, we MUST re-process even if we processed empty before
    if (!wasEmptyNowHasValue && !valueChanged && !categoriesChanged && processedValueRef.current === value && processedCategoriesRef.current === categoriesHash) {
      // Already processed this exact combination - skip
      return;
    }

    console.log('📂 SimpleCategorySelect - Processing value change:', {
      value,
      flatCategoriesCount: flatCategories.length,
      storeId,
      hasStoreId: !!storeId,
      previousValue: previousValueRef.current,
      processedValue: processedValueRef.current,
      valueChanged,
      categoriesChanged,
      wasEmptyNowHasValue
    });

    if (!value) {
      // Only clear if we haven't already cleared, or if we had a value before
      if (processedValueRef.current !== '' || processedCategoriesRef.current !== categoriesHash) {
        console.log('📂 SimpleCategorySelect - No value provided, clearing selections');
        processedValueRef.current = '';
        processedCategoriesRef.current = categoriesHash;
        setSelectedMainCategory('');
        setSelectedSubCategory('');
      }
      return;
    }

    // Use flatCategories to find the category (includes all categories, not just filtered)
    const selectedCategory = flatCategories.find(cat => cat.id === value);
    
    if (!selectedCategory) {
      console.warn('📂 SimpleCategorySelect - Category not found in flatCategories:', {
        categoryId: value,
        availableCategories: flatCategories.length,
        categoryIds: flatCategories.map(c => c.id).slice(0, 10),
        categoryNames: flatCategories.map(c => c.name).slice(0, 10)
      });
      // Don't clear selections if category not found - might be a timing issue
      // The category might exist but not be in the filtered list yet
      return;
    }

    // Check if the category exists in mainCategories before setting
    // This ensures the Select component can find the value
    const targetMainCategoryId = selectedCategory.parent_category_id || selectedCategory.id;
    const categoryExistsInMain = mainCategories.some(cat => cat.id === targetMainCategoryId);
    
    console.log('📂 SimpleCategorySelect - Category found:', {
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      parentCategoryId: selectedCategory.parent_category_id,
      mainCategoriesCount: mainCategories.length,
      targetMainCategoryId: targetMainCategoryId,
      categoryExistsInMain: categoryExistsInMain,
      mainCategoryIds: mainCategories.map(c => c.id)
    });

    // If mainCategories is not populated yet, wait for it
    // This prevents the Select from not finding the value and triggering onValueChange('')
    if (mainCategories.length === 0 || !categoryExistsInMain) {
      console.log('📂 SimpleCategorySelect - Waiting for mainCategories to be populated or category to be added');
      return;
    }

    // Mark as processed
    processedValueRef.current = value;
    processedCategoriesRef.current = categoriesHash;

    // Determine if this is a main category or subcategory
    // Mark that we're setting programmatically to prevent Select from triggering onValueChange
    // Set the flag BEFORE any state updates to ensure it's active when Select re-renders
    isSettingProgrammaticallyRef.current = true;
    console.log('📂 SimpleCategorySelect - Setting programmatic flag to true');
    
    // Use requestAnimationFrame to ensure the flag is set before React processes the state update
    requestAnimationFrame(() => {
      if (selectedCategory.parent_category_id) {
        // This is a subcategory - set both main and sub
        console.log('📂 SimpleCategorySelect - Setting subcategory:', {
          mainCategory: selectedCategory.parent_category_id,
          subCategory: value
        });
        setSelectedMainCategory(selectedCategory.parent_category_id);
        setSelectedSubCategory(value);
      } else {
        // This is a main category
        console.log('📂 SimpleCategorySelect - Setting main category:', value);
        setSelectedMainCategory(value);
        setSelectedSubCategory('');
      }
      
      // Reset the flag after Select has updated (longer timeout to ensure Select has processed)
      setTimeout(() => {
        isSettingProgrammaticallyRef.current = false;
        console.log('📂 SimpleCategorySelect - Programmatic update flag reset');
      }, 300);
    });
  }, [value, flatCategories, storeId, mainCategories]); // Added mainCategories to ensure it's populated before setting selectedMainCategory

  const handleMainCategoryChange = (categoryId: string) => {
    // If we're setting the value programmatically, don't trigger onValueChange
    // This prevents clearing the value when Select updates due to programmatic value change
    if (isSettingProgrammaticallyRef.current) {
      console.log('📂 SimpleCategorySelect - Ignoring Select change (programmatic update):', categoryId);
      return;
    }
    
    console.log('📂 SimpleCategorySelect - User selected main category:', categoryId);
    
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
    // If we're setting the value programmatically, don't trigger onValueChange
    if (isSettingProgrammaticallyRef.current) {
      console.log('📂 SimpleCategorySelect - Ignoring Select change (programmatic update):', categoryId);
      return;
    }
    
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
          onValueChange={(newValue) => {
            // Only handle if not setting programmatically
            if (!isSettingProgrammaticallyRef.current) {
              handleMainCategoryChange(newValue);
            } else {
              console.log('📂 SimpleCategorySelect - Ignoring Select onValueChange (programmatic):', newValue);
            }
          }}
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