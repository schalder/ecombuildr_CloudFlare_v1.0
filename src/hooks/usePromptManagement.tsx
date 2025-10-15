import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Prompt, PromptCategory } from './usePrompts';

export type { PromptCategory };

export interface CreatePromptData {
  title: string;
  description?: string;
  content: string;
  category_id?: string;
  tags?: string[];
  is_published?: boolean;
  display_order?: number;
}

export interface UpdatePromptData extends Partial<CreatePromptData> {
  id: string;
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order?: number;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: string;
}

export const usePromptManagement = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all prompts (including unpublished)
  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('prompts')
        .select(`
          *,
          category:prompt_categories(*)
        `)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPrompts(data || []);
    } catch (err) {
      console.error('Error fetching prompts:', err);
      setError('Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('prompt_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories');
    }
  };

  // Create new prompt
  const createPrompt = async (data: CreatePromptData): Promise<Prompt | null> => {
    try {
      const { data: result, error } = await supabase
        .from('prompts')
        .insert([data])
        .select(`
          *,
          category:prompt_categories(*)
        `)
        .single();

      if (error) throw error;
      
      // Refresh prompts list
      await fetchPrompts();
      return result;
    } catch (err) {
      console.error('Error creating prompt:', err);
      setError('Failed to create prompt');
      return null;
    }
  };

  // Update prompt
  const updatePrompt = async (data: UpdatePromptData): Promise<Prompt | null> => {
    try {
      const { id, ...updateData } = data;
      const { data: result, error } = await supabase
        .from('prompts')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          category:prompt_categories(*)
        `)
        .single();

      if (error) throw error;
      
      // Refresh prompts list
      await fetchPrompts();
      return result;
    } catch (err) {
      console.error('Error updating prompt:', err);
      setError('Failed to update prompt');
      return null;
    }
  };

  // Delete prompt
  const deletePrompt = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh prompts list
      await fetchPrompts();
      return true;
    } catch (err) {
      console.error('Error deleting prompt:', err);
      setError('Failed to delete prompt');
      return false;
    }
  };

  // Toggle prompt published status
  const togglePromptPublished = async (id: string, isPublished: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('prompts')
        .update({ is_published: isPublished })
        .eq('id', id);

      if (error) throw error;
      
      // Refresh prompts list
      await fetchPrompts();
      return true;
    } catch (err) {
      console.error('Error toggling prompt published status:', err);
      setError('Failed to update prompt status');
      return false;
    }
  };

  // Create new category
  const createCategory = async (data: CreateCategoryData): Promise<PromptCategory | null> => {
    try {
      const { data: result, error } = await supabase
        .from('prompt_categories')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh categories list
      await fetchCategories();
      return result;
    } catch (err) {
      console.error('Error creating category:', err);
      setError('Failed to create category');
      return null;
    }
  };

  // Update category
  const updateCategory = async (data: UpdateCategoryData): Promise<PromptCategory | null> => {
    try {
      const { id, ...updateData } = data;
      const { data: result, error } = await supabase
        .from('prompt_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh categories list
      await fetchCategories();
      return result;
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Failed to update category');
      return null;
    }
  };

  // Delete category
  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('prompt_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh categories list
      await fetchCategories();
      return true;
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category');
      return false;
    }
  };

  useEffect(() => {
    fetchPrompts();
    fetchCategories();
  }, []);

  return {
    prompts,
    categories,
    loading,
    error,
    createPrompt,
    updatePrompt,
    deletePrompt,
    togglePromptPublished,
    createCategory,
    updateCategory,
    deleteCategory,
    refetchPrompts: fetchPrompts,
    refetchCategories: fetchCategories
  };
};
