import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SEOData {
  id: string;
  page_slug: string;
  title: string;
  description: string;
  og_image?: string;
  keywords?: string[];
  is_active: boolean;
}

export const useSEO = (pageSlug: string) => {
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSEOData();
  }, [pageSlug]);

  const fetchSEOData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('seo_pages')
        .select('*')
        .eq('page_slug', pageSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setSeoData(data);
    } catch (err: any) {
      console.error('Error fetching SEO data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSEOData = async (updates: Partial<Omit<SEOData, 'id' | 'page_slug'>>) => {
    try {
      if (!seoData) return false;

      const { error: updateError } = await supabase
        .from('seo_pages')
        .update(updates)
        .eq('id', seoData.id);

      if (updateError) {
        throw updateError;
      }

      // Refresh data
      await fetchSEOData();
      return true;
    } catch (err: any) {
      console.error('Error updating SEO data:', err);
      setError(err.message);
      return false;
    }
  };

  return {
    seoData,
    loading,
    error,
    updateSEOData,
    refetch: fetchSEOData
  };
};

// Hook for admin to manage all SEO pages
export const useAllSEOPages = () => {
  const [seoPages, setSeoPages] = useState<SEOData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllSEOPages();
  }, []);

  const fetchAllSEOPages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('seo_pages')
        .select('*')
        .order('page_slug');

      if (fetchError) {
        throw fetchError;
      }

      setSeoPages(data || []);
    } catch (err: any) {
      console.error('Error fetching all SEO pages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createSEOPage = async (pageData: Omit<SEOData, 'id'>) => {
    try {
      const { error: createError } = await supabase
        .from('seo_pages')
        .insert([pageData]);

      if (createError) {
        throw createError;
      }

      await fetchAllSEOPages();
      return true;
    } catch (err: any) {
      console.error('Error creating SEO page:', err);
      setError(err.message);
      return false;
    }
  };

  const updateSEOPage = async (id: string, updates: Partial<Omit<SEOData, 'id'>>) => {
    try {
      const { error: updateError } = await supabase
        .from('seo_pages')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      await fetchAllSEOPages();
      return true;
    } catch (err: any) {
      console.error('Error updating SEO page:', err);
      setError(err.message);
      return false;
    }
  };

  const deleteSEOPage = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('seo_pages')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      await fetchAllSEOPages();
      return true;
    } catch (err: any) {
      console.error('Error deleting SEO page:', err);
      setError(err.message);
      return false;
    }
  };

  return {
    seoPages,
    loading,
    error,
    createSEOPage,
    updateSEOPage,
    deleteSEOPage,
    refetch: fetchAllSEOPages
  };
};