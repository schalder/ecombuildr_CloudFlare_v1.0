import { useEffect } from 'react';

interface ServiceWorkerManagerProps {
  enabled?: boolean;
}

export const ServiceWorkerManager: React.FC<ServiceWorkerManagerProps> = ({ 
  enabled = process.env.NODE_ENV === 'production' 
}) => {
  useEffect(() => {
    if (!enabled || !('serviceWorker' in navigator)) return;

    const registerServiceWorker = async () => {
      try {
        // Create a minimal service worker inline
        const swCode = `
          const CACHE_NAME = 'storefront-cache-v1';
          const CRITICAL_RESOURCES = [
            '/',
            '/src/main.tsx',
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'
          ];

          self.addEventListener('install', (event) => {
            event.waitUntil(
              caches.open(CACHE_NAME)
                .then((cache) => cache.addAll(CRITICAL_RESOURCES))
                .then(() => self.skipWaiting())
            );
          });

          self.addEventListener('activate', (event) => {
            event.waitUntil(
              caches.keys().then((cacheNames) => {
                return Promise.all(
                  cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                      return caches.delete(cacheName);
                    }
                  })
                );
              }).then(() => self.clients.claim())
            );
          });

          self.addEventListener('fetch', (event) => {
            // Cache strategy: Network first for HTML, Cache first for assets
            if (event.request.destination === 'document') {
              event.respondWith(
                fetch(event.request)
                  .then((response) => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                      .then((cache) => cache.put(event.request, responseClone));
                    return response;
                  })
                  .catch(() => caches.match(event.request))
              );
            } else if (event.request.destination === 'image' || 
                       event.request.destination === 'font' ||
                       event.request.destination === 'style') {
              event.respondWith(
                caches.match(event.request)
                  .then((response) => {
                    if (response) return response;
                    return fetch(event.request)
                      .then((response) => {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                          .then((cache) => cache.put(event.request, responseClone));
                        return response;
                      });
                  })
              );
            }
          });
        `;

        // Create blob URL for service worker
        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);

        const registration = await navigator.serviceWorker.register(swUrl);
        
        console.log('Service Worker registered successfully:', registration);

        // Clean up blob URL after registration
        URL.revokeObjectURL(swUrl);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, refresh may be needed
                console.log('New content available, consider refreshing');
              }
            });
          }
        });

      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    };

    registerServiceWorker();

    // Cleanup on unmount
    return () => {
      // Service worker will remain active
    };
  }, [enabled]);

  return null;
};