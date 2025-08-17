import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useWebsiteContext } from '@/contexts/WebsiteContext';

/**
 * Hook to resolve channel context (website_id and funnel_id) for order tracking
 * Priority: URL params -> WebsiteContext -> null
 */
export const useChannelContext = () => {
  const { websiteId: urlWebsiteId, funnelId } = useParams<{ websiteId?: string; funnelId?: string }>();
  const { websiteId: contextWebsiteId } = useWebsiteContext();
  
  return useMemo(() => {
    const resolvedWebsiteId = urlWebsiteId || contextWebsiteId || null;
    const resolvedFunnelId = funnelId || null;
    
    console.debug('[useChannelContext] Resolved:', { 
      websiteId: resolvedWebsiteId, 
      funnelId: resolvedFunnelId,
      source: urlWebsiteId ? 'URL' : contextWebsiteId ? 'Context' : 'None'
    });
    
    return {
      websiteId: resolvedWebsiteId,
      funnelId: resolvedFunnelId,
    };
  }, [urlWebsiteId, contextWebsiteId, funnelId]);
};