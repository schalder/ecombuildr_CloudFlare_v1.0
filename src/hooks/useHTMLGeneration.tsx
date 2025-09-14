import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateStaticHTML, HTMLGenerationOptions } from '@/lib/htmlGenerator';
import { PageBuilderData } from '@/components/page-builder/types';
import { SEOConfig } from '@/lib/seo';
import { useToast } from '@/components/ui/use-toast';

export interface GenerateHTMLParams {
  pageData: PageBuilderData;
  contentType: 'website' | 'funnel';
  contentId: string;
  customDomain?: string;
  seoConfig?: SEOConfig;
  websiteSettings?: any;
  funnelSettings?: any;
}

export function useHTMLGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateAndSaveHTML = async ({
    pageData,
    contentType,
    contentId,
    customDomain,
    seoConfig = {},
    websiteSettings,
    funnelSettings
  }: GenerateHTMLParams): Promise<boolean> => {
    setIsGenerating(true);

    try {
      console.log('📝 Generating HTML snapshot via edge function...', { contentType, contentId, customDomain });
      
      // Call the html-snapshot edge function to generate optimized HTML
      const { data, error } = await supabase.functions.invoke('html-snapshot', {
        body: {
          contentType,
          contentId,
          customDomain,
          seoConfig,
          pageData,
          websiteSettings,
          funnelSettings
        }
      });

      if (error) {
        console.error('Error calling html-snapshot function:', error);
        toast({
          title: 'HTML Generation Failed',
          description: 'Failed to generate HTML snapshot via edge function',
          variant: 'destructive'
        });
        return false;
      }

      if (!data?.success) {
        console.error('HTML snapshot generation failed:', data);
        toast({
          title: 'HTML Generation Failed',
          description: data?.error || 'Unknown error during HTML generation',
          variant: 'destructive'
        });
        return false;
      }

      console.log('✅ HTML snapshot generated successfully via edge function');
      toast({
        title: 'HTML Generated',
        description: 'Static HTML snapshot created successfully',
      });
      
      return true;

    } catch (error) {
      console.error('❌ Error generating HTML:', error);
      toast({
        title: 'HTML Generation Error',
        description: 'Failed to generate static HTML',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteHTMLSnapshot = async (contentId: string, contentType: 'website' | 'funnel' | 'website_page' | 'funnel_step', customDomain?: string) => {
    try {
      let query = supabase
        .from('html_snapshots')
        .delete()
        .eq('content_id', contentId)
        .eq('content_type', contentType);

      if (customDomain) {
        query = query.eq('custom_domain', customDomain);
      } else {
        query = query.is('custom_domain', null);
      }

      const { error } = await query;

      if (error) {
        console.error('Error deleting HTML snapshot:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting HTML snapshot:', error);
      return false;
    }
  };

  const regenerateAllSnapshots = async (contentId: string, contentType: 'website' | 'funnel', pageData: PageBuilderData, seoConfig: SEOConfig) => {
    try {
      // Get all domains for this content
      let domains: string[] = [];
      let storeId: string | null = null;
      
      if (contentType === 'website') {
        const { data: websiteData } = await supabase
          .from('websites')
          .select('domain, store_id')
          .eq('id', contentId)
          .single();
        
        if (websiteData) {
          storeId = websiteData.store_id;
          if (websiteData.domain) {
            domains.push(websiteData.domain);
          }
        }
      } else if (contentType === 'funnel') {
        const { data: funnelData } = await supabase
          .from('funnels')
          .select('domain, store_id')
          .eq('id', contentId)
          .single();
        
        if (funnelData) {
          storeId = funnelData.store_id;
          if (funnelData.domain) {
            domains.push(funnelData.domain);
          }
        }
      }

      // Get custom domains for this store
      if (storeId) {
        const { data: customDomains } = await supabase
          .from('custom_domains')
          .select('domain')
          .eq('store_id', storeId)
          .eq('is_verified', true)
          .eq('dns_configured', true);

        if (customDomains) {
          domains.push(...customDomains.map(cd => cd.domain));
        }
      }

      // Generate for each domain + default
      const promises = [
        // Default version (no custom domain)
        generateAndSaveHTML({
          pageData,
          contentType,
          contentId,
          seoConfig
        }),
        // Custom domain versions
        ...domains.map(domain => generateAndSaveHTML({
          pageData,
          contentType,
          contentId,
          customDomain: domain,
          seoConfig
        }))
      ];

      const results = await Promise.all(promises);
      return results.every(result => result);

    } catch (error) {
      console.error('Error regenerating all snapshots:', error);
      return false;
    }
  };

  return {
    generateAndSaveHTML,
    deleteHTMLSnapshot,
    regenerateAllSnapshots,
    isGenerating
  };
}