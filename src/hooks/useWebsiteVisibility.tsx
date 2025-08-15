import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Website {
  id: string;
  name: string;
  slug: string;
}

export const useProductWebsiteVisibility = (productId: string) => {
  const [visibleWebsites, setVisibleWebsites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchVisibility = async () => {
    if (!productId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_website_visibility')
        .select('website_id')
        .eq('product_id', productId);

      if (error) throw error;
      setVisibleWebsites(data?.map(v => v.website_id) || []);
    } catch (error: any) {
      console.error('Error fetching product visibility:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateVisibility = async (websiteIds: string[]) => {
    if (!productId) return;

    setLoading(true);
    try {
      // Remove existing visibility records
      await supabase
        .from('product_website_visibility')
        .delete()
        .eq('product_id', productId);

      // Add new visibility records
      if (websiteIds.length > 0) {
        const records = websiteIds.map(websiteId => ({
          product_id: productId,
          website_id: websiteId
        }));

        const { error } = await supabase
          .from('product_website_visibility')
          .insert(records);

        if (error) throw error;
      }

      setVisibleWebsites(websiteIds);
      toast({
        title: "Success",
        description: "Product visibility updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to update product visibility",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisibility();
  }, [productId]);

  return { visibleWebsites, loading, updateVisibility, refetch: fetchVisibility };
};

export const useCategoryWebsiteVisibility = (categoryId: string) => {
  const [visibleWebsites, setVisibleWebsites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchVisibility = async () => {
    if (!categoryId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('category_website_visibility')
        .select('website_id')
        .eq('category_id', categoryId);

      if (error) throw error;
      setVisibleWebsites(data?.map(v => v.website_id) || []);
    } catch (error: any) {
      console.error('Error fetching category visibility:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateVisibility = async (websiteIds: string[]) => {
    if (!categoryId) return;

    setLoading(true);
    try {
      // Remove existing visibility records
      await supabase
        .from('category_website_visibility')
        .delete()
        .eq('category_id', categoryId);

      // Add new visibility records
      if (websiteIds.length > 0) {
        const records = websiteIds.map(websiteId => ({
          category_id: categoryId,
          website_id: websiteId
        }));

        const { error } = await supabase
          .from('category_website_visibility')
          .insert(records);

        if (error) throw error;
      }

      setVisibleWebsites(websiteIds);
      toast({
        title: "Success",
        description: "Category visibility updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update category visibility", 
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisibility();
  }, [categoryId]);

  return { visibleWebsites, loading, updateVisibility, refetch: fetchVisibility };
};

export const useStoreWebsitesForSelection = (storeId: string) => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWebsites = async () => {
    if (!storeId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('websites')
        .select('id, name, slug')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setWebsites(data || []);
    } catch (error: any) {
      console.error('Error fetching websites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, [storeId]);

  return { websites, loading, refetch: fetchWebsites };
};