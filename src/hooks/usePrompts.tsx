import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PromptCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: string;
  category_id?: string;
  title: string;
  description?: string;
  content: string;
  is_published: boolean;
  tags?: string[];
  display_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  category?: PromptCategory;
}

export interface UsePromptsOptions {
  categoryId?: string;
  searchQuery?: string;
  limit?: number;
}

export const usePrompts = (options: UsePromptsOptions = {}) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('prompt_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories((data || []) as any);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories');
    }
  };

  // Fetch prompts
  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('prompts')
        .select(`
          *,
          category:prompt_categories(*)
        `)
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      if (options.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }

      if (options.searchQuery) {
        query = query.or(`title.ilike.%${options.searchQuery}%,description.ilike.%${options.searchQuery}%,content.ilike.%${options.searchQuery}%`);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPrompts((data || []) as any);
    } catch (err) {
      console.error('Error fetching prompts:', err);
      setError('Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch single prompt by ID
  const fetchPromptById = async (id: string): Promise<Prompt | null> => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select(`
          *,
          category:prompt_categories(*)
        `)
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data as any;
    } catch (err) {
      console.error('Error fetching prompt:', err);
      setError('Failed to fetch prompt');
      return null;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [options.categoryId, options.searchQuery, options.limit]);

  return {
    prompts,
    categories,
    loading,
    error,
    refetch: fetchPrompts,
    fetchPromptById
  };
};
