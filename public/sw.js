
// Service Worker for Push Notifications
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('Push notification received', event);

  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const { title, body, icon, badge, tag, data: customData } = data;

  const options = {
    body,
    icon: icon || '/favicon.ico',
    badge: badge || '/favicon.ico',
    tag: tag || 'default',
    data: customData,
    actions: [
      {
        action: 'view',
        title: 'View Order',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/favicon.ico'
      }
    ],
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked', event);

  event.notification.close();

  if (event.action === 'view' && event.notification.data?.orderId) {
    // Open the dashboard with the specific order
    event.waitUntil(
      self.clients.openWindow(`/dashboard/orders?highlight=${event.notification.data.orderId}`)
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open dashboard
    event.waitUntil(
      self.clients.openWindow('/dashboard')
    );
  }
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed', event);
});
