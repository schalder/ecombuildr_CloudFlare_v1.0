import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_category_id: string | null;
  parent_name?: string;
  level?: number;
  full_path?: string;
  store_id: string;
  created_at: string;
}

export const useCategories = (storeId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: categories = [],
    isLoading: loading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['categories', storeId],
    queryFn: async () => {
      if (!user || !storeId) return [];

      // Use the hierarchical function for better organization
      const { data, error } = await supabase.rpc('get_category_hierarchy', {
        store_uuid: storeId
      });

      if (error) throw error;
      return (data || []) as Category[];
    },
    enabled: !!user && !!storeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  // Get categories with website visibility info
  const {
    data: categoriesWithWebsites = [],
    isLoading: websiteLoading
  } = useQuery({
    queryKey: ['categories-with-websites', storeId],
    queryFn: async () => {
      if (!user || !storeId) return [];

        const { data: cats, error: catErr } = await supabase
          .from('categories')
          .select('*')
          .eq('store_id', storeId)
          .order('name');

        if (catErr) throw catErr;
        if (!cats || cats.length === 0) return [] as any[];

        const categoryIds = cats.map((c: any) => c.id);

        const { data: vis, error: visErr } = await supabase
          .from('category_website_visibility')
          .select('category_id, website_id')
          .in('category_id', categoryIds);

        if (visErr) throw visErr;

        const byCat: Record<string, any[]> = {};
        (vis || []).forEach((v: any) => {
          if (!byCat[v.category_id]) byCat[v.category_id] = [];
          byCat[v.category_id].push({ website_id: v.website_id });
        });

        const result = cats.map((c: any) => ({
          ...c,
          category_website_visibility: byCat[c.id] || [],
        }));

        return result as any[];
    },
    enabled: !!user && !!storeId,
    staleTime: 2 * 60 * 1000,
  });

  // Get flat categories for dropdowns
  const {
    data: flatCategories = [],
    isLoading: flatLoading
  } = useQuery({
    queryKey: ['flat-categories', storeId],
    queryFn: async () => {
      if (!user || !storeId) return [];

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeId)
        .order('name');

      if (error) throw error;
      return (data || []) as Category[];
    },
    enabled: !!user && !!storeId,
    staleTime: 2 * 60 * 1000,
  });

  const createCategory = useMutation({
    mutationFn: async ({ name, description, parent_category_id, image_url, websiteIds = [] }: { 
      name: string; 
      description?: string; 
      parent_category_id?: string;
      image_url?: string;
      websiteIds?: string[];
    }) => {
      if (!storeId) throw new Error('Store ID is required');
      
      // Require website selection - don't add to all websites by default
      if (websiteIds.length === 0) {
        throw new Error('Please select at least one website for this category');
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .insert({
          store_id: storeId,
          name,
          slug,
          description: description || null,
          parent_category_id: parent_category_id || null,
          image_url: image_url || null
        })
        .select()
        .single();

      if (categoryError) throw categoryError;

      // Add to selected websites only
      const visibilityRecords = websiteIds.map(websiteId => ({
        category_id: categoryData.id,
        website_id: websiteId
      }));

      const { error: visibilityError } = await supabase
        .from('category_website_visibility')
        .insert(visibilityRecords);

      if (visibilityError) {
        // If visibility insert fails, clean up the category
        await supabase.from('categories').delete().eq('id', categoryData.id);
        
        if (visibilityError.code === '23505') {
          throw new Error('A category with this name already exists for the selected website');
        }
        throw new Error(`Failed to assign category to website: ${visibilityError.message}`);
      }

      return categoryData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] });
      queryClient.invalidateQueries({ queryKey: ['flat-categories', storeId] });
      queryClient.invalidateQueries({ queryKey: ['categories-with-websites', storeId] });
      toast({
        title: 'Success',
        description: 'Category created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create category',
        variant: 'destructive',
      });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ 
      id, 
      name, 
      description, 
      parent_category_id,
      image_url
    }: { 
      id: string; 
      name: string; 
      description?: string; 
      parent_category_id?: string;
      image_url?: string;
    }) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const { data, error } = await supabase
        .from('categories')
        .update({
          name,
          slug,
          description: description || null,
          parent_category_id: parent_category_id || null,
          image_url: image_url || null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] });
      queryClient.invalidateQueries({ queryKey: ['flat-categories', storeId] });
      queryClient.invalidateQueries({ queryKey: ['categories-with-websites', storeId] });
      toast({
        title: 'Success',
        description: 'Category updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update category',
        variant: 'destructive',
      });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] });
      queryClient.invalidateQueries({ queryKey: ['flat-categories', storeId] });
      queryClient.invalidateQueries({ queryKey: ['categories-with-websites', storeId] });
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive',
      });
    },
  });

  // Category visibility management
  const updateCategoryVisibility = useMutation({
    mutationFn: async ({ categoryId, websiteIds }: { categoryId: string; websiteIds: string[] }) => {
      // First, get all subcategories recursively
      const getAllSubcategories = async (parentId: string): Promise<string[]> => {
        const { data, error } = await supabase
          .from('categories')
          .select('id')
          .eq('parent_category_id', parentId)
          .eq('store_id', storeId);

        if (error) throw error;
        
        let allIds = data?.map(cat => cat.id) || [];
        
        // Recursively get subcategories of subcategories
        for (const childId of [...allIds]) {
          const grandchildren = await getAllSubcategories(childId);
          allIds = [...allIds, ...grandchildren];
        }
        
        return allIds;
      };

      const subcategoryIds = await getAllSubcategories(categoryId);
      const allCategoryIds = [categoryId, ...subcategoryIds];

      // Remove existing visibility records for parent and all subcategories
      await supabase
        .from('category_website_visibility')
        .delete()
        .in('category_id', allCategoryIds);

      // Add new visibility records for parent and all subcategories
      if (websiteIds.length > 0) {
        const records = allCategoryIds.flatMap(catId => 
          websiteIds.map(websiteId => ({
            category_id: catId,
            website_id: websiteId
          }))
        );

        const { error } = await supabase
          .from('category_website_visibility')
          .insert(records);

        if (error) throw error;
      }

      return { updatedCategories: allCategoryIds.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['categories-with-websites', storeId] });
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] });
      
      const message = result.updatedCategories === 1 
        ? 'Category visibility updated successfully'
        : `Category visibility updated for ${result.updatedCategories} categories (including subcategories)`;
        
      toast({
        title: 'Success',
        description: message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update category visibility',
        variant: 'destructive',
      });
    },
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Unknown error') : null;

  return {
    categories,
    flatCategories,
    categoriesWithWebsites,
    loading: loading || flatLoading || websiteLoading,
    error,
    refetch,
    createCategory,
    updateCategory,
    deleteCategory,
    updateCategoryVisibility
  };
};

export type { Category };