import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PageSEOData {
  id?: string;
  page_slug: string;
  page_type?: 'website_page' | 'funnel_step';
  page_id?: string;
  title?: string;
  description?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  og_image?: string;
  meta_robots?: string;
  canonical_url?: string;
  language_code?: string;
  keywords?: string[];
  is_active: boolean;
}

export const usePageSEO = (pageId: string, pageSlug: string, pageType: 'website_page' | 'funnel_step') => {
  const [seoData, setSeoData] = useState<PageSEOData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (pageId && pageSlug) {
      fetchSEOData();
    }
  }, [pageId, pageSlug]);

  const fetchSEOData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('seo_pages')
        .select('*')
        .eq('page_slug', pageSlug)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSeoData(data || {
        page_slug: pageSlug,
        page_type: pageType,
        page_id: pageId,
        is_active: true
      });
    } catch (error) {
      console.error('Error fetching SEO data:', error);
      toast({
        title: "Error",
        description: "Failed to load SEO settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSEOData = async (updates: Partial<PageSEOData>) => {
    try {
      setSaving(true);
      
      const dataToSave = {
        page_slug: pageSlug,
        title: updates.seo_title || updates.title || 'Untitled Page',
        description: updates.seo_description || updates.description || '',
        keywords: updates.seo_keywords || updates.keywords || [],
        og_image: updates.og_image || '',
        is_active: true
      };

      if (seoData?.id) {
        // Update existing record
        const { error } = await supabase
          .from('seo_pages')
          .update(dataToSave)
          .eq('id', seoData.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('seo_pages')
          .insert([dataToSave]);

        if (error) throw error;
      }

      await fetchSEOData();
      
      toast({
        title: "Success",
        description: "SEO settings saved successfully",
      });

      return true;
    } catch (error) {
      console.error('Error saving SEO data:', error);
      toast({
        title: "Error",
        description: "Failed to save SEO settings",
        variant: "destructive"
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    seoData,
    loading,
    saving,
    saveSEOData,
    refetch: fetchSEOData
  };
};