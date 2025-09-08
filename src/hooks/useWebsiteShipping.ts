import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { useWebsiteContext } from '@/contexts/WebsiteContext';

// Define minimal shipping settings type to avoid circular dependency
type ShippingSettings = {
  enabled: boolean;
  country?: string;
  restOfCountryFee: number;
  restOfCountryLabel?: string;
  cityRules: Array<{
    city: string;
    fee: number;
    label?: string;
  }>;
  areaRules?: Array<{
    area: string;
    fee: number;
    label?: string;
  }>;
  showOptionsAtCheckout?: boolean;
  weightTiers?: Array<{
    maxWeight: number;
    fee: number;
    label?: string;
  }>;
  freeShippingThreshold?: number;
  freeShippingMinWeight?: number;
};

// Resolve website-level shipping settings in a route-agnostic, domain-aware way.
// Priority:
// 1) websiteId param
// 2) websiteSlug param
// 3) store slug param (loads store; falls back to store.settings.shipping)
// 4) window.location.hostname matches websites.domain or websites.canonical_domain
export function useWebsiteShipping() {
  const { slug, websiteId: urlWebsiteId, websiteSlug: urlWebsiteSlug, funnelId } = useParams<{
    slug?: string;
    websiteId?: string;
    websiteSlug?: string;
    funnelId?: string;
  }>();
  const { websiteId: contextWebsiteId, websiteSlug: contextWebsiteSlug } = useWebsiteContext();
  const { store } = useStore();
  const [websiteShipping, setWebsiteShipping] = useState<ShippingSettings | undefined>(undefined);
  
  // Priority: Context -> URL params -> hostname
  const websiteId = contextWebsiteId || urlWebsiteId;
  const websiteSlug = contextWebsiteSlug || urlWebsiteSlug;

  useEffect(() => {
    (async () => {
      try {
        // 1) Explicit websiteId (context or param)
        if (websiteId) {
          const { data } = await supabase
            .from('websites')
            .select('settings')
            .eq('id', websiteId)
            .maybeSingle();
          const ship = (data as any)?.settings?.shipping;
          if (ship) {
            setWebsiteShipping(ship as ShippingSettings);
          }
          return;
        }

        // 2) Clean slug-based website route (context or param)
        if (websiteSlug) {
          const { data } = await supabase
            .from('websites')
            .select('settings')
            .eq('slug', websiteSlug)
            .eq('is_active', true)
            .maybeSingle();
          const ship = (data as any)?.settings?.shipping;
          if (ship) {
            setWebsiteShipping(ship as ShippingSettings);
          }
          return;
        }

        // 3) Funnel route - resolve website from funnel
        if (funnelId) {
          const { data } = await supabase
            .from('funnels')
            .select('website_id, store_id')
            .eq('id', funnelId)
            .maybeSingle();
          
          if (data?.website_id) {
            const { data: websiteData } = await supabase
              .from('websites')
              .select('settings')
              .eq('id', data.website_id)
              .maybeSingle();
            const ship = (websiteData as any)?.settings?.shipping;
            if (ship) {
              setWebsiteShipping(ship as ShippingSettings);
            }
          }
          return;
        }

        // 4) Domain-based resolution (custom domains and legacy domains)
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        if (host) {
          // First try custom_domains table for verified domains
          const { data: customDomainData } = await supabase
            .from('custom_domains')
            .select('store_id')
            .eq('domain', host)
            .eq('is_verified', true)
            .eq('dns_configured', true)
            .maybeSingle();

          if (customDomainData?.store_id) {
            // Check for domain connections to find associated website
            const { data: connectionData } = await supabase
              .from('domain_connections')
              .select('content_id, content_type')
              .eq('store_id', customDomainData.store_id)
              .eq('content_type', 'website')
              .maybeSingle();

            if (connectionData?.content_id) {
              // Get website settings from the connected content
              const { data: websiteData } = await supabase
                .from('websites')
                .select('settings')
                .eq('id', connectionData.content_id)
                .eq('is_active', true)
                .maybeSingle();
              
              const ship = (websiteData as any)?.settings?.shipping;
              if (ship) {
                console.log('[useWebsiteShipping] Found custom domain website shipping for', host, ship);
                setWebsiteShipping(ship as ShippingSettings);
                return;
              }
            }
          }

          // Fallback: try direct website domain fields (legacy approach)
          const { data: domainData } = await supabase
            .from('websites')
            .select('settings')
            .eq('domain', host)
            .eq('is_active', true)
            .maybeSingle();
          
          if (domainData) {
            const ship = (domainData as any)?.settings?.shipping;
            if (ship) {
              console.log('[useWebsiteShipping] Found legacy domain-based shipping for', host, ship);
              setWebsiteShipping(ship as ShippingSettings);
            }
          }
        }
      } catch (e) {
        console.warn('[useWebsiteShipping] resolution error', e);
      }
    })();
  }, [slug, websiteId, websiteSlug, funnelId, contextWebsiteId, contextWebsiteSlug]);

  // Fallback: use store-level shipping settings if website-level not present
  useEffect(() => {
    if (!websiteShipping && (store as any)?.settings?.shipping) {
      setWebsiteShipping(((store as any).settings.shipping) as ShippingSettings);
    }
  }, [store, websiteShipping]);

  return { websiteShipping } as const;
}