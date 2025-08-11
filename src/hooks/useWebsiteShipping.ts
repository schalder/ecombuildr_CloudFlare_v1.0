import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import type { ShippingSettings } from '@/lib/shipping';

// Resolve website-level shipping settings in a route-agnostic, domain-aware way.
// Priority:
// 1) websiteId param
// 2) websiteSlug param
// 3) store slug param (loads store; falls back to store.settings.shipping)
// 4) window.location.hostname matches websites.domain or websites.canonical_domain
export function useWebsiteShipping() {
  const { slug, websiteId, websiteSlug } = useParams<{
    slug?: string;
    websiteId?: string;
    websiteSlug?: string;
  }>();
  const { store, loadStore, loadStoreById } = useStore();
  const [websiteShipping, setWebsiteShipping] = useState<ShippingSettings | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        // 1) Explicit websiteId param
        if (websiteId) {
          const { data } = await supabase
            .from('websites')
            .select('store_id, settings')
            .eq('id', websiteId)
            .maybeSingle();
          if (data?.store_id) await loadStoreById(data.store_id);
          const ship = (data as any)?.settings?.shipping;
          if (ship) setWebsiteShipping(ship as ShippingSettings);
          return;
        }

        // 2) Clean slug-based website route
        if (websiteSlug) {
          const { data } = await supabase
            .from('websites')
            .select('id, store_id, settings')
            .eq('slug', websiteSlug)
            .eq('is_active', true)
            .maybeSingle();
          if (data?.store_id) await loadStoreById(data.store_id);
          const ship = (data as any)?.settings?.shipping;
          if (ship) setWebsiteShipping(ship as ShippingSettings);
          return;
        }

        // 3) Storefront slug route ("/store/:slug")
        if (slug) {
          await loadStore(slug);
          // No website-level config here; fallback handled below
        }

        // 4) Domain-based resolution (custom domains)
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        if (host) {
          const { data } = await supabase
            .from('websites')
            .select('id, store_id, settings')
            .or(`domain.eq.${host},canonical_domain.eq.${host}`)
            .eq('is_active', true)
            .maybeSingle();
          if (data?.store_id) await loadStoreById(data.store_id);
          const ship = (data as any)?.settings?.shipping;
          if (ship) setWebsiteShipping(ship as ShippingSettings);
        }
      } catch (e) {
        // Silent failure; components will fall back to store-level shipping if available
        // console.warn('[useWebsiteShipping] resolution error', e);
      }
    })();
  }, [slug, websiteId, websiteSlug, loadStore, loadStoreById]);

  // Fallback: use store-level shipping settings if website-level not present
  useEffect(() => {
    if (!websiteShipping && (store as any)?.settings?.shipping) {
      setWebsiteShipping(((store as any).settings.shipping) as ShippingSettings);
      try { console.debug('[useWebsiteShipping] Using store-level shipping settings as fallback'); } catch {}
    }
  }, [store, websiteShipping]);

  return { websiteShipping } as const;
}
