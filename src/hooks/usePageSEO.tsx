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
      
      // Fetch from the appropriate table based on page type
      let data = null;
      let error = null;

      if (pageType === 'website_page') {
        const result = await supabase
          .from('website_pages')
          .select('seo_title, seo_description, seo_keywords, og_image, meta_robots, canonical_url, language_code')
          .eq('id', pageId)
          .maybeSingle();
        data = result.data;
        error = result.error;
      } else if (pageType === 'funnel_step') {
        const result = await supabase
          .from('funnel_steps')
          .select('seo_title, seo_description, seo_keywords, og_image, meta_robots, canonical_url, language_code')
          .eq('id', pageId)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }

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
      
      const seoDataToSave = {
        seo_title: updates.seo_title || updates.title || null,
        seo_description: updates.seo_description || updates.description || null,
        seo_keywords: updates.seo_keywords || updates.keywords || null,
        og_image: updates.og_image || null,
        meta_robots: updates.meta_robots || 'index,follow',
        canonical_url: updates.canonical_url || null,
        language_code: updates.language_code || 'en'
      };

      // Save to the appropriate table based on page type
      if (pageType === 'website_page') {
        const { error } = await supabase
          .from('website_pages')
          .update(seoDataToSave)
          .eq('id', pageId);

        if (error) throw error;
      } else if (pageType === 'funnel_step') {
        const { error } = await supabase
          .from('funnel_steps')
          .update(seoDataToSave)
          .eq('id', pageId);

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