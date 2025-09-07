import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MarketingContent {
  id: string;
  section: string;
  youtube_url?: string;
  hero_image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UpdateMarketingContentData {
  youtube_url?: string;
  hero_image_url?: string;
  is_active?: boolean;
}

export const useMarketingContent = () => {
  const [content, setContent] = useState<MarketingContent | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContent = async (section: string = 'hero') => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_marketing_content')
        .select('*')
        .eq('section', section)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setContent(data);
    } catch (error) {
      console.error('Error fetching marketing content:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (section: string, data: UpdateMarketingContentData) => {
    try {
      const { error } = await supabase
        .from('platform_marketing_content')
        .upsert({
          section,
          ...data,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Marketing content updated successfully"
      });

      // Refetch content after update
      await fetchContent(section);
    } catch (error) {
      console.error('Error updating marketing content:', error);
      toast({
        title: "Error",
        description: "Failed to update marketing content",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  return {
    content,
    loading,
    updateContent,
    refetch: fetchContent
  };
};