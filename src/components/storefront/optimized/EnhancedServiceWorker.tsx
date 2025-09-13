import { useEffect } from 'react';

interface EnhancedServiceWorkerProps {
  enableServiceWorker?: boolean;
  cacheStrategy?: 'cache-first' | 'network-first' | 'stale-while-revalidate';
}

export const EnhancedServiceWorker: React.FC<EnhancedServiceWorkerProps> = ({
  enableServiceWorker = true,
  cacheStrategy = 'stale-while-revalidate'
}) => {
  useEffect(() => {
    if (!enableServiceWorker || !('serviceWorker' in navigator)) {
      return;
    }

    // Enhanced Service Worker implementation
    const swCode = `
      const CACHE_NAME = 'storefront-cache-v2';
      const STATIC_CACHE = 'static-cache-v2';
      const DYNAMIC_CACHE = 'dynamic-cache-v2';
      const IMAGE_CACHE = 'image-cache-v2';
      
      const STATIC_FILES = [
        '/',
        '/manifest.json'
      ];
      
      // Install event - cache static files
      self.addEventListener('install', (event) => {
        event.waitUntil(
          Promise.all([
            caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_FILES)),
            self.skipWaiting()
          ])
        );
      });
      
      // Activate event - clean old caches
      self.addEventListener('activate', (event) => {
        event.waitUntil(
          caches.keys().then(cacheNames => {
            return Promise.all(
              cacheNames.map(cacheName => {
                if (!['storefront-cache-v2', 'static-cache-v2', 'dynamic-cache-v2', 'image-cache-v2'].includes(cacheName)) {
                  return caches.delete(cacheName);
                }
              })
            );
          }).then(() => self.clients.claim())
        );
      });
      
      // Fetch event - implement advanced caching strategies
      self.addEventListener('fetch', (event) => {
        const { request } = event;
        const url = new URL(request.url);
        
        // Skip non-GET requests and extensions
        if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;
        
        // Handle different resource types with optimized strategies
        if (request.destination === 'image') {
          event.respondWith(handleImageRequest(request));
        } else if (url.pathname.match(/\\.(js|css|woff2|woff|ttf)$/)) {
          event.respondWith(handleStaticAsset(request));
        } else if (url.pathname.startsWith('/api/')) {
          event.respondWith(handleAPIRequest(request));
        } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
          event.respondWith(handleFontRequest(request));
        } else {
          event.respondWith(handlePageRequest(request));
        }
      });
      
      // Optimized image caching with size limits
      async function handleImageRequest(request) {
        const cache = await caches.open(IMAGE_CACHE);
        const cached = await cache.match(request);
        
        if (cached) {
          // Serve from cache immediately and optionally update in background
          if (Math.random() > 0.9) { // 10% chance to refresh cache
            fetch(request).then(response => {
              if (response.ok && response.headers.get('content-length')) {
                const size = parseInt(response.headers.get('content-length'));
                if (size < 500000) { // Only cache images < 500KB
                  cache.put(request, response.clone());
                }
              }
            }).catch(() => {});
          }
          return cached;
        }
        
        try {
          const response = await fetch(request);
          if (response.ok && response.headers.get('content-length')) {
            const size = parseInt(response.headers.get('content-length'));
            if (size < 500000) { // Only cache images < 500KB
              cache.put(request, response.clone());
            }
          }
          return response;
        } catch (error) {
          return cached || new Response('Image not available', { status: 503 });
        }
      }
      
      // Cache-first for static assets (JS, CSS, fonts)
      async function handleStaticAsset(request) {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        
        if (cached) {
          return cached;
        }
        
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        } catch (error) {
          return cached || new Response('Asset not available', { status: 503 });
        }
      }
      
      // Special handling for Google Fonts
      async function handleFontRequest(request) {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        
        if (cached) {
          return cached;
        }
        
        try {
          const response = await fetch(request);
          if (response.ok) {
            // Cache fonts for a long time
            cache.put(request, response.clone());
          }
          return response;
        } catch (error) {
          return cached || new Response('Font not available', { status: 503 });
        }
      }
      
      // Network-first for API requests with offline fallback
      async function handleAPIRequest(request) {
        const cache = await caches.open(DYNAMIC_CACHE);
        
        try {
          const response = await fetch(request);
          if (response.ok) {
            // Only cache successful GET requests
            if (request.method === 'GET') {
              cache.put(request, response.clone());
            }
          }
          return response;
        } catch (error) {
          const cached = await cache.match(request);
          return cached || new Response(JSON.stringify({ error: 'Offline' }), { 
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Stale-while-revalidate for pages
      async function handlePageRequest(request) {
        const cache = await caches.open(DYNAMIC_CACHE);
        const cached = await cache.match(request);
        
        // Serve cached version immediately if available
        if (cached) {
          // Update cache in background
          fetch(request).then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
          }).catch(() => {});
          return cached;
        }
        
        // If no cache, fetch from network
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        } catch (error) {
          return new Response('Page not available offline', { status: 503 });
        }
      }
      
      // Periodic cache cleanup
      self.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CLEANUP_CACHE') {
          cleanupCaches();
        }
      });
      
      async function cleanupCaches() {
        const imageCache = await caches.open(IMAGE_CACHE);
        const keys = await imageCache.keys();
        
        // Remove old entries if cache is too large
        if (keys.length > 100) {
          const oldEntries = keys.slice(0, keys.length - 50);
          await Promise.all(oldEntries.map(key => imageCache.delete(key)));
        }
      }
    `;

    // Register enhanced service worker
    const registerServiceWorker = async () => {
      try {
        const swBlob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(swBlob);
        
        const registration = await navigator.serviceWorker.register(swUrl);
        
        console.log('Enhanced Service Worker registered:', registration);
        
        // Schedule periodic cache cleanup
        setInterval(() => {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CLEANUP_CACHE' });
          }
        }, 300000); // Every 5 minutes
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available - could show notification
                console.log('New version available');
              }
            });
          }
        });
        
        URL.revokeObjectURL(swUrl);
      } catch (error) {
        console.error('Enhanced Service Worker registration failed:', error);
      }
    };

    // Register after page load
    if (document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      window.addEventListener('load', registerServiceWorker);
      return () => window.removeEventListener('load', registerServiceWorker);
    }
  }, [enableServiceWorker, cacheStrategy]);

  return null;
};