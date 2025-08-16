import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PageBuilderElement } from '@/components/page-builder/types';

/**
 * Hook to resolve websiteId for filtering products/categories by website visibility
 * Priority: element.content.websiteId -> URL params -> undefined (store-wide)
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
    
    // Fallback to store-wide (no filtering)
    return undefined;
  }, [element?.content?.websiteId, urlWebsiteId]);
};