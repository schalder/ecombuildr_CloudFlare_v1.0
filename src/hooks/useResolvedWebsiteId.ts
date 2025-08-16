import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PageBuilderElement } from '@/components/page-builder/types';
import { useWebsiteContext } from '@/contexts/WebsiteContext';

/**
 * Hook to resolve websiteId for filtering products/categories by website visibility
 * Priority: element.content.websiteId -> WebsiteContext -> URL params -> undefined (store-wide)
 */
export const useResolvedWebsiteId = (element?: PageBuilderElement): string | undefined => {
  const { websiteId: urlWebsiteId } = useParams<{ websiteId?: string }>();
  const { websiteId: contextWebsiteId } = useWebsiteContext();
  
  return useMemo(() => {
    // Check element content first
    const elementWebsiteId = element?.content?.websiteId;
    
    // If explicitly set to empty string, show store-wide
    if (elementWebsiteId === '') {
      return undefined;
    }
    
    // If set to specific websiteId, use it
    if (elementWebsiteId && elementWebsiteId !== 'auto') {
      return elementWebsiteId;
    }
    
    // Auto-detect: use context websiteId if available
    if (contextWebsiteId) {
      return contextWebsiteId;
    }
    
    // Fallback: use URL parameter if available
    if (urlWebsiteId) {
      return urlWebsiteId;
    }
    
    // Final fallback: store-wide (no filtering)
    return undefined;
  }, [element?.content?.websiteId, contextWebsiteId, urlWebsiteId]);
};