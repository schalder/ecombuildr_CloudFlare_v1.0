import { useCallback, useEffect } from 'react';
import { logger } from '@/lib/logger';

export interface AttributionData {
  source: 'facebook' | 'tiktok' | 'google' | 'organic' | 'direct';
  medium: string;
  campaign: string | null;
  data: Record<string, any>;
}

const ATTRIBUTION_STORAGE_KEY = 'attribution_data';

function detectAttributionSource(): AttributionData {
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  
  // Priority 1: UTM parameters
  if (utmSource) {
    const source = utmSource.toLowerCase();
    if (source === 'facebook' || source === 'fb') {
      return {
        source: 'facebook',
        medium: utmMedium || 'cpc',
        campaign: utmCampaign,
        data: {
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_term: urlParams.get('utm_term'),
          utm_content: urlParams.get('utm_content'),
        },
      };
    }
    if (source === 'tiktok' || source === 'tt') {
      return {
        source: 'tiktok',
        medium: utmMedium || 'cpc',
        campaign: utmCampaign,
        data: {
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_term: urlParams.get('utm_term'),
          utm_content: urlParams.get('utm_content'),
        },
      };
    }
    if (source === 'google' || source === 'gclid') {
      return {
        source: 'google',
        medium: utmMedium || 'cpc',
        campaign: utmCampaign,
        data: {
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_term: urlParams.get('utm_term'),
          utm_content: urlParams.get('utm_content'),
        },
      };
    }
  }
  
  // Priority 2: Pixel identifiers
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  if (cookies['_fbp'] || urlParams.get('fbclid')) {
    return {
      source: 'facebook',
      medium: 'social',
      campaign: null,
      data: {
        fbp: cookies['_fbp'],
        fbclid: urlParams.get('fbclid'),
      },
    };
  }
  if (urlParams.get('ttclid') || cookies['ttclid']) {
    return {
      source: 'tiktok',
      medium: 'social',
      campaign: null,
      data: {
        ttclid: urlParams.get('ttclid') || cookies['ttclid'],
      },
    };
  }
  if (urlParams.get('gclid')) {
    return {
      source: 'google',
      medium: 'cpc',
      campaign: null,
      data: {
        gclid: urlParams.get('gclid'),
      },
    };
  }
  
  // Priority 3: Referrer domain
  const referrer = document.referrer;
  if (referrer) {
    try {
      const referrerDomain = new URL(referrer).hostname.toLowerCase();
      if (referrerDomain.includes('facebook.com') || referrerDomain.includes('fb.com')) {
        return {
          source: 'facebook',
          medium: 'social',
          campaign: null,
          data: { referrer },
        };
      }
      if (referrerDomain.includes('tiktok.com')) {
        return {
          source: 'tiktok',
          medium: 'social',
          campaign: null,
          data: { referrer },
        };
      }
      if (referrerDomain.includes('google.com')) {
        return {
          source: 'google',
          medium: 'organic',
          campaign: null,
          data: { referrer },
        };
      }
    } catch (e) {
      // Invalid referrer URL
      logger.warn('[AttributionTracking] Invalid referrer URL:', referrer);
    }
  }
  
  // Default: Organic or Direct
  return {
    source: referrer ? 'organic' : 'direct',
    medium: referrer ? 'organic' : 'direct',
    campaign: null,
    data: { referrer: referrer || null },
  };
}

export const useAttributionTracking = () => {
  // Capture attribution on mount if not already stored
  useEffect(() => {
    const stored = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!stored) {
      const attribution = detectAttributionSource();
      sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
      logger.debug('[AttributionTracking] Captured attribution:', attribution);
    }
  }, []);

  const captureAttribution = useCallback(() => {
    const attribution = detectAttributionSource();
    sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
    logger.debug('[AttributionTracking] Captured attribution:', attribution);
    return attribution;
  }, []);

  const getAttribution = useCallback((): AttributionData | null => {
    try {
      const stored = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as AttributionData;
      }
      // If not stored, detect and store now
      const attribution = detectAttributionSource();
      sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
      return attribution;
    } catch (error) {
      logger.warn('[AttributionTracking] Failed to get attribution:', error);
      return null;
    }
  }, []);

  const clearAttribution = useCallback(() => {
    sessionStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
    logger.debug('[AttributionTracking] Cleared attribution');
  }, []);

  return {
    captureAttribution,
    getAttribution,
    clearAttribution,
  };
};
