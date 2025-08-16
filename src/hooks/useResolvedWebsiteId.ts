import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PageBuilderElement } from '@/components/page-builder/types';

/**
 * Hook to resolve websiteId for filtering products/categories by website visibility
 * Priority: element.content.websiteId -> URL params -> URL path -> undefined (store-wide)
 */
export const useResolvedWebsiteId = (element?: PageBuilderElement): string | undefined => {
  const { websiteId: urlWebsiteId } = useParams<{ websiteId?: string }>();
  
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
    
    // Auto-detect: use URL parameter if available
    if (urlWebsiteId) {
      return urlWebsiteId;
    }
    
    // Fallback: extract from URL path for builder routes
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const builderMatch = path.match(/\/websites\/([a-f0-9-]+)\/pages\/[a-f0-9-]+\/builder/);
      const websiteMatch = path.match(/\/websites\/([a-f0-9-]+)/);
      
      if (builderMatch) {
        return builderMatch[1];
      } else if (websiteMatch) {
        return websiteMatch[1];
      }
    }
    
    // Fallback to store-wide (no filtering)
    return undefined;
  }, [element?.content?.websiteId, urlWebsiteId]);
};