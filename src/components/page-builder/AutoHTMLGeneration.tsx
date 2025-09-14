import { useEffect } from 'react';
import { useHTMLGeneration } from '@/hooks/useHTMLGeneration';
import { PageBuilderData } from './types';
import { SEOConfig } from '@/lib/seo';

interface AutoHTMLGenerationProps {
  pageData: PageBuilderData;
  contentType: 'website' | 'funnel' | 'website_page' | 'funnel_step';
  contentId: string;
  seoConfig?: SEOConfig;
  isPublished?: boolean;
  triggerGeneration?: number; // Change this to trigger regeneration
}

export function AutoHTMLGeneration({
  pageData,
  contentType,
  contentId,
  seoConfig,
  isPublished = false,
  triggerGeneration = 0
}: AutoHTMLGenerationProps) {
  const { generateAndSaveHTML } = useHTMLGeneration();

  useEffect(() => {
    if (!isPublished || !pageData?.sections?.length) {
      return;
    }

    const generateHTML = async () => {
      try {
        console.log('🔄 Auto-generating HTML snapshot for:', contentType, contentId);
        
        await generateAndSaveHTML({
          pageData,
          contentType: contentType as any,
          contentId,
          seoConfig
        });
        
        console.log('✅ HTML snapshot generated successfully');
      } catch (error) {
        console.error('❌ Failed to auto-generate HTML:', error);
      }
    };

    // Debounce the generation
    const timeoutId = setTimeout(generateHTML, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [pageData, contentType, contentId, seoConfig, isPublished, triggerGeneration, generateAndSaveHTML]);

  return null; // This is a utility component with no UI
}