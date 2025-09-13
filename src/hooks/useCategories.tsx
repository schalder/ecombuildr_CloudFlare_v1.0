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
    mutationFn: async ({ name, description, parent_category_id }: { 
      name: string; 
      description?: string; 
      parent_category_id?: string;
    }) => {
      if (!storeId) throw new Error('Store ID is required');

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const { data, error } = await supabase
        .from('categories')
        .insert({
          store_id: storeId,
          name,
          slug,
          description: description || null,
          parent_category_id: parent_category_id || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] });
      queryClient.invalidateQueries({ queryKey: ['flat-categories', storeId] });
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
      parent_category_id 
    }: { 
      id: string; 
      name: string; 
      description?: string; 
      parent_category_id?: string;
    }) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const { data, error } = await supabase
        .from('categories')
        .update({
          name,
          slug,
          description: description || null,
          parent_category_id: parent_category_id || null
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

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Unknown error') : null;

  return {
    categories,
    flatCategories,
    loading: loading || flatLoading,
    error,
    refetch,
    createCategory,
    updateCategory,
    deleteCategory
  };
};

export type { Category };